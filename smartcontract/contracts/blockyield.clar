;; BlockYield - Lossless Yield-Backed Tournament & Competition Engine
;; V3: Added yield-strategy-trait dynamic dispatch for real yield routing
;;     Fixed platform-fee bug (fee now applied only on profit)
;;     Fixed reserved keyword clash (principal -> curr-principal)

(use-trait yield-strategy-trait .yield-strategy-trait.yield-strategy-trait)

;; Optional active yield strategy - set by admin via deploy-yield
(define-data-var active-strategy (optional principal) none)

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
(define-constant ERR-STAKE-EXISTS (err u411)) ;; User already placed a bet for this block

;; Data Vars
(define-data-var fee-address principal tx-sender)

;; ===== Multi-Admin 70% Quorum =====
(define-map admins principal bool)
(define-data-var admin-count uint u1)

;; Initialize deployer as admin
(map-set admins tx-sender true)

(define-read-only (is-admin (caller principal))
    (default-to false (map-get? admins caller))
)

(define-read-only (get-required-approvals)
    (let ((count (var-get admin-count)))
        (if (is-eq count u1)
            u1
            (/ (+ (* count u70) u99) u100)
        )
    )
)

(define-map admin-proposals
    uint
    {
        candidate: principal,
        is-add: bool,
        approvals: uint,
        executed: bool
    }
)
(define-map admin-has-approved { proposal-id: uint, approver: principal } bool)
(define-data-var next-admin-proposal-id uint u0)

(define-private (execute-admin-proposal (proposal-id uint))
    (let (
        (proposal (unwrap-panic (map-get? admin-proposals proposal-id)))
        (required-approvals (get-required-approvals))
        (candidate (get candidate proposal))
    )
        (if (>= (get approvals proposal) required-approvals)
            (begin
                (map-set admin-proposals proposal-id (merge proposal { executed: true }))
                (if (get is-add proposal)
                    (begin
                        (map-set admins candidate true)
                        (var-set admin-count (+ (var-get admin-count) u1))
                    )
                    (begin
                        (map-set admins candidate false)
                        (var-set admin-count (- (var-get admin-count) u1))
                    )
                )
                true
            )
            false
        )
    )
)

(define-public (propose-admin-change (candidate principal) (is-add bool))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (let ((proposal-id (var-get next-admin-proposal-id)))
            (map-set admin-proposals proposal-id {
                candidate: candidate,
                is-add: is-add,
                approvals: u1,
                executed: false
            })
            (map-set admin-has-approved { proposal-id: proposal-id, approver: tx-sender } true)
            (var-set next-admin-proposal-id (+ proposal-id u1))
            (execute-admin-proposal proposal-id)
            (ok proposal-id)
        )
    )
)

(define-public (approve-admin-change (proposal-id uint))
    (let (
        (proposal (unwrap! (map-get? admin-proposals proposal-id) (err u404)))
    )
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (asserts! (not (get executed proposal)) (err u400))
        (asserts! (not (default-to false (map-get? admin-has-approved { proposal-id: proposal-id, approver: tx-sender }))) (err u409))

        (map-set admin-has-approved { proposal-id: proposal-id, approver: tx-sender } true)
        (map-set admin-proposals proposal-id (merge proposal { approvals: (+ (get approvals proposal) u1) }))
        
        (execute-admin-proposal proposal-id)
        (ok true)
    )
)

(define-public (set-fee-address (new-address principal))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (var-set fee-address new-address)
        (ok true)
    )
)
(define-data-var platform-fee-percent uint u2) ;; 2% protocol fee
(define-data-var yield-rate-per-block uint u95) ;; Simulated ~0.5% APY (95/1B scale * 52,560 blocks/yr ~= 0.5%)
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
;; When an active yield strategy is configured, the deposited STX is
;; forwarded to the strategy contract for yield generation.
(define-public (deposit-stx (amount uint) (strategy <yield-strategy-trait>))
    (begin
        (asserts! (> amount u0) ERR-INVALID-STAKE)
        ;; 1. Accrue any pending yield first
        (accrue-yield tx-sender)
        
        ;; 2. Transfer STX principal to the contract vault
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; 3. If active strategy matches the passed strategy, route funds to it
        (match (var-get active-strategy)
            strat-addr
            (begin
                (asserts! (is-eq (contract-of strategy) strat-addr) ERR-NOT-AUTHORIZED)
                (try! (as-contract (contract-call? strategy deposit amount)))
            )
            true
        )
        
        ;; 4. Update the vault balance
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
;; When an active yield strategy is configured, STX is first pulled back
;; from the strategy before returning it to the user.
(define-public (withdraw-stx (amount uint) (strategy <yield-strategy-trait>))
    (let
        (
            ;; Accrue any pending yield first
            (accrue-status (accrue-yield tx-sender))
            (vault-data (unwrap! (map-get? user-vault tx-sender) ERR-NO-STAKE))
            (current-principal (get principal-amount vault-data))
            (recipient tx-sender)
        )
        (asserts! (>= current-principal amount) ERR-INSUFFICIENT-FUNDS)
        
        ;; If active strategy matches, pull funds back from it first
        (match (var-get active-strategy)
            strat-addr
            (begin
                (asserts! (is-eq (contract-of strategy) strat-addr) ERR-NOT-AUTHORIZED)
                (try! (as-contract (contract-call? strategy withdraw amount)))
            )
            true
        )
        
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
            ;; Prevent silent stake overwrite -- one bet per user per block
            (asserts! (is-none (map-get? stakes { block-height: target-height, user: tx-sender })) ERR-STAKE-EXISTS)
            
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
                (admin-addr (var-get fee-address))
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

;; Admin: Deploy contract-held STX to an external yield strategy (trait-based dispatch)
;; This routes the full reserve to a compliant yield strategy contract.
(define-public (deploy-yield (strategy <yield-strategy-trait>) (amount uint))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (var-set active-strategy (some (contract-of strategy)))
        (try! (as-contract (contract-call? strategy deposit amount)))
        (ok true)
    )
)

;; Admin: Unset yield strategy and withdraw all funds back to contract reserve
(define-public (recall-yield (strategy <yield-strategy-trait>) (amount uint))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (asserts! (is-eq (some (contract-of strategy)) (var-get active-strategy)) ERR-NOT-AUTHORIZED)
        (try! (as-contract (contract-call? strategy withdraw amount)))
        (var-set active-strategy none)
        (ok true)
    )
)

;; Admin function to fund the contract reserve with STX for yield payouts
(define-public (fund-yield-reserve (amount uint))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (ok true)
    )
)

;; Admin: Update the simulated yield rate per block (governance)
(define-public (set-yield-rate (new-rate uint))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (var-set yield-rate-per-block new-rate)
        (ok true)
    )
)

;; Admin: Update the platform fee percentage -- capped at 10% (governance)
(define-public (set-platform-fee (new-fee uint))
    (begin
        (asserts! (is-admin tx-sender) ERR-NOT-AUTHORIZED)
        (asserts! (<= new-fee u10) ERR-INVALID-STAKE)
        (var-set platform-fee-percent new-fee)
        (ok true)
    )
)



;; Read-only Functions

(define-read-only (get-vault-data (user principal))
    (map-get? user-vault user)
)

(define-read-only (get-active-strategy)
    (var-get active-strategy)
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
