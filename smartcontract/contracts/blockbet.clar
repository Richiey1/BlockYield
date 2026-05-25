;; BlockBet Permissionless: Predict the Chain
;; Autonomous block-hash parity game (Even/Odd)

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INVALID-STAKE (err u402))
(define-constant ERR-ROUND-CLOSED (err u403))
(define-constant ERR-ROUND-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-CLAIMED (err u405))
(define-constant ERR-NOT-WINNER (err u406))
(define-constant ERR-NO-STAKE (err u407))
(define-constant ERR-TOO-EARLY (err u408))
(define-constant ERR-BLOCK-EXPIRED (err u409))

;; Data Vars
(define-data-var protocol-admin principal tx-sender)
(define-data-var platform-fee-percent uint u2) ;; 2% protocol fee

;; Prediction Stakes: Tracked by Block Height and User
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

;; Public Functions

;; Place a stake on a future block height
(define-public (place-stake (target-height uint) (amount uint) (prediction uint))
    (let
        (
            (current-block block-height)
            (current-pool (default-to { total-pool: u0, even-pool: u0, odd-pool: u0, status: "open" } (map-get? block-pools target-height)))
        )
        ;; Must bet at least 2 blocks in the future
        (asserts! (> target-height (+ current-block u1)) ERR-ROUND-CLOSED)
        (asserts! (is-eq (get status current-pool) "open") ERR-ROUND-CLOSED)
        (asserts! (> amount u0) ERR-INVALID-STAKE)
        (asserts! (or (is-eq prediction u1) (is-eq prediction u2)) ERR-INVALID-STAKE)
        
        ;; Transfer stake to contract (supports micro-STX units)
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; Update stake map
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

;; Claim reward for a winning prediction
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
                
                ;; Proportional share: (user-stake * total-pool) / winning-pool
                (raw-share (/ (* user-stake total-pool) winning-pool))
                (platform-fee (/ (* raw-share (var-get platform-fee-percent)) u100))
                (payout-amount (- raw-share platform-fee))
                (admin-addr (var-get protocol-admin))
            )
            
            ;; Mark claimed
            (map-set claimed-users { block-height: target-height, user: tx-sender } true)
            
            ;; Transfer protocol fee to admin
            (if (> platform-fee u0)
                (try! (as-contract (stx-transfer? platform-fee tx-sender admin-addr)))
                false
            )
            
            ;; Transfer reward to winner (supports micro-STX payout)
            (try! (as-contract (stx-transfer? payout-amount tx-sender tx-sender)))
            
            (ok payout-amount)
        )
    )
)

;; Read-only Functions

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
