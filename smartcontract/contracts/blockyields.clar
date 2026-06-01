;; BlockYields Lossless Yield-Backed Tournament & Competition Engine
;; Overhauled from parity-betting game to Lossless PoX-simulated staking engine

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INVALID-STAKE (err u402))
(define-constant ERR-ROUND-CLOSED (err u403))
(define-constant ERR-ROUND-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-CLAIMED (err u405))
(define-constant ERR-NOT-WINNER (err u406))
(define-constant ERR-NO-STAKE (err u407))
(define-constant ERR-TOO-EARLY (err u408))
(define-constant ERR-BLOCK-EXPIRED (err u409))
(define-constant ERR-INSUFFICIENT-FUNDS (err u410))

;; Data Vars
(define-data-var protocol-admin principal tx-sender)
(define-data-var platform-fee-percent uint u2) ;; 2% protocol fee
(define-data-var yield-rate-per-block uint u95) ;; Simulated ~5% APY per block
(define-data-var yield-precision-scale uint u1000000000) ;; 1,000,000,000 scaling factor

;; Vault Balances: Tracks principal deposits and last yield accrual block
(define-map user-vault
    principal
    {
        principal-amount: uint,
        last-yield-block: uint
    }
)

;; Yield Credits: Accumulated "Yield Ammo" for risk-free betting
(define-map user-yield-credits principal uint)

;; Stakes placed in virtual yield credits
(define-map stakes 
    { block-height: uint, user: principal }
    { amount: uint, prediction: uint } ;; 1 for Even, 2 for Odd
)

;; Pool Tracking per Block Height
(define-map block-pools
    uint 
    {
        total-pool: uint,
        even-pool: uint,
        odd-pool: uint,
        status: (string-ascii 10) ;; "open", "resolved"
    }
)

;; Resolved Outcomes
(define-map block-outcomes uint uint)

;; Tracking Claim Status
(define-map claimed-users
    { block-height: uint, user: principal }
    bool
)

;; Private Helpers

;; Calculate pending yield since the last updated block height
(define-private (calculate-pending-yield (user principal))
    (let
        (
            (vault-data (default-to { principal-amount: u0, last-yield-block: block-height } (map-get? user-vault user)))
            (curr-principal (get principal-amount vault-data))
            (last-block (get last-yield-block vault-data))
        )
        (if (or (is-eq curr-principal u0) (>= last-block block-height))
            u0
            (let
                (
                    (blocks-elapsed (- block-height last-block))
                    (accrued (/ (* (* curr-principal blocks-elapsed) (var-get yield-rate-per-block)) (var-get yield-precision-scale)))
                )
                accrued
            )
        )
    )
)

;; Accrue pending yield into the user's yield-credits balance and update the block tracker
(define-private (accrue-yield (user principal))
    (let
        (
            (pending (calculate-pending-yield user))
            (current-credits (default-to u0 (map-get? user-yield-credits user)))
            (vault-data (default-to { principal-amount: u0, last-yield-block: block-height } (map-get? user-vault user)))
        )
        ;; Add pending yield to user's credits
        (if (> pending u0)
            (map-set user-yield-credits user (+ current-credits pending))
            true
        )
        ;; Update last update block height while preserving principal
        (map-set user-vault user (merge vault-data { last-yield-block: block-height }))
    )
)

;; Public Functions

;; Deposit STX principal into the vault (lossless custody)
(define-public (deposit-stx (amount uint))
    (begin
        (asserts! (> amount u0) ERR-INVALID-STAKE)
        ;; 1. Accrue any pending yield first
        (accrue-yield tx-sender)
        
        ;; 2. Transfer STX principal to the contract vault
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; 3. Update the vault balance
        (let
            (
                (vault-data (default-to { principal-amount: u0, last-yield-block: block-height } (map-get? user-vault tx-sender)))
            )
            (map-set user-vault tx-sender {
                principal-amount: (+ (get principal-amount vault-data) amount),
                last-yield-block: block-height
            })
        )
        (ok true)
    )
)

;; Withdraw STX principal from the vault (100% safe custody)
(define-public (withdraw-stx (amount uint))
    (let
        (
            ;; Accrue any pending yield first
            (accrue-status (accrue-yield tx-sender))
            (vault-data (unwrap! (map-get? user-vault tx-sender) ERR-NO-STAKE))
            (current-principal (get principal-amount vault-data))
            (recipient tx-sender)
        )
        (asserts! (>= current-principal amount) ERR-INSUFFICIENT-FUNDS)
        
        ;; Update the vault balance
        (map-set user-vault tx-sender (merge vault-data { principal-amount: (- current-principal amount) }))
        
        ;; Transfer STX back to user
        (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        (ok true)
    )
)

;; Redeem accumulated yield credits for real STX from the contract reserve
(define-public (redeem-yield-credits (amount uint))
    (begin
        ;; Accrue any pending yield first
        (accrue-yield tx-sender)
        (let
            (
                (current-credits (default-to u0 (map-get? user-yield-credits tx-sender)))
                (recipient tx-sender)
            )
            (asserts! (>= current-credits amount) ERR-INSUFFICIENT-FUNDS)
            
            ;; Deduct credits
            (map-set user-yield-credits tx-sender (- current-credits amount))
            
            ;; Transfer STX to user
            (try! (as-contract (stx-transfer? amount tx-sender recipient)))
            (ok true)
        )
    )
)

;; Place a prediction bet using virtual yield credits (not principal!)
(define-public (place-yield-bet (target-height uint) (amount uint) (prediction uint))
    (begin
        ;; Accrue yield first to catch up
        (accrue-yield tx-sender)
        (let
            (
                (current-block block-height)
                (current-pool (default-to { total-pool: u0, even-pool: u0, odd-pool: u0, status: "open" } (map-get? block-pools target-height)))
                (user-credits (default-to u0 (map-get? user-yield-credits tx-sender)))
            )
            ;; Must bet at least 2 blocks in the future
            (asserts! (> target-height (+ current-block u1)) ERR-ROUND-CLOSED)
            (asserts! (is-eq (get status current-pool) "open") ERR-ROUND-CLOSED)
            (asserts! (> amount u0) ERR-INVALID-STAKE)
            (asserts! (or (is-eq prediction u1) (is-eq prediction u2)) ERR-INVALID-STAKE)
            (asserts! (>= user-credits amount) ERR-INSUFFICIENT-FUNDS)
            
            ;; Deduct yield credits from user
            (map-set user-yield-credits tx-sender (- user-credits amount))
            
            ;; Update stakes map
            (map-set stakes { block-height: target-height, user: tx-sender } { amount: amount, prediction: prediction })
            
            ;; Update block pool stats
            (map-set block-pools target-height {
                total-pool: (+ (get total-pool current-pool) amount),
                even-pool: (if (is-eq prediction u1) (+ (get even-pool current-pool) amount) (get even-pool current-pool)),
                odd-pool: (if (is-eq prediction u2) (+ (get odd-pool current-pool) amount) (get odd-pool current-pool)),
                status: "open"
            })
            (ok true)
        )
    )
)

;; Resolve a block height outcome permissionlessly
(define-public (resolve-block (target-height uint))
    (let
        (
            (current-block block-height)
            (block-time (unwrap! (get-block-info? time target-height) ERR-TOO-EARLY))
            (pool (unwrap! (map-get? block-pools target-height) ERR-ROUND-NOT-FOUND))
        )
        (asserts! (is-eq (get status pool) "open") ERR-ALREADY-CLAIMED)
        
        ;; Determine outcome based on block timestamp parity (1 for Even, 2 for Odd)
        (let
            (
                (outcome (if (is-eq (mod block-time u2) u0) u1 u2))
            )
            (map-set block-outcomes target-height outcome)
            (map-set block-pools target-height (merge pool { status: "resolved" }))
            (ok outcome)
        )
    )
)

;; Claim reward for a winning prediction (payout added to yield-credits)
(define-public (claim-reward (target-height uint))
    (let
        (
            (stake (unwrap! (map-get? stakes { block-height: target-height, user: tx-sender }) ERR-NO-STAKE))
            (pool (unwrap! (map-get? block-pools target-height) ERR-ROUND-NOT-FOUND))
            (outcome (unwrap! (map-get? block-outcomes target-height) ERR-ROUND-CLOSED))
        )
        ;; Asserts
        (asserts! (is-eq (get status pool) "resolved") ERR-ROUND-CLOSED)
        (asserts! (is-eq (get prediction stake) outcome) ERR-NOT-WINNER)
        (asserts! (is-none (map-get? claimed-users { block-height: target-height, user: tx-sender })) ERR-ALREADY-CLAIMED)
        
        (let
            (
                (user-stake (get amount stake))
                (total-pool (get total-pool pool))
                (winning-pool (if (is-eq outcome u1) (get even-pool pool) (get odd-pool pool)))
                
                ;; Proportional share of the yield-credits pool: (user-stake * total-pool) / winning-pool
                (raw-share (/ (* user-stake total-pool) winning-pool))
                (profit (if (> raw-share user-stake) (- raw-share user-stake) u0))
                (platform-fee (/ (* profit (var-get platform-fee-percent)) u100))
                (payout-amount (- raw-share platform-fee))
                (admin-addr (var-get protocol-admin))
                (current-credits (default-to u0 (map-get? user-yield-credits tx-sender)))
            )
            
            ;; Mark claimed
            (map-set claimed-users { block-height: target-height, user: tx-sender } true)
            
            ;; Transfer fee to admin in yield credits (optional) or just deduct
            (if (> platform-fee u0)
                (let
                    (
                        (admin-credits (default-to u0 (map-get? user-yield-credits admin-addr)))
                    )
                    (map-set user-yield-credits admin-addr (+ admin-credits platform-fee))
                )
                true
            )
            
            ;; Add payout yield credits to winner
            (map-set user-yield-credits tx-sender (+ current-credits payout-amount))
            (ok payout-amount)
        )
    )
)

;; Admin function to fund the contract reserve with STX for yield payouts
(define-public (fund-yield-reserve (amount uint))
    (begin
        (asserts! (is-eq tx-sender (var-get protocol-admin)) ERR-NOT-AUTHORIZED)
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (ok true)
    )
)

;; Read-only Functions

(define-read-only (get-vault-data (user principal))
    (map-get? user-vault user)
)

(define-read-only (get-yield-balance (user principal))
    (let
        (
            (accrued (calculate-pending-yield user))
            (current-credits (default-to u0 (map-get? user-yield-credits user)))
        )
        (+ current-credits accrued)
    )
)

(define-read-only (get-block-pool (height uint))
    (map-get? block-pools height)
)

(define-read-only (get-user-stake (height uint) (user principal))
    (map-get? stakes { block-height: height, user: user })
)

(define-read-only (get-outcome (height uint))
    (map-get? block-outcomes height)
)

(define-read-only (has-user-claimed (height uint) (user principal))
    (default-to false (map-get? claimed-users { block-height: height, user: user }))
)
