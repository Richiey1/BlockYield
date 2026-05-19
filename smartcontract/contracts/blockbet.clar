;; BlockBet: Predict the Chain, Not the Market
;; Real-time on-chain prediction game with pooled claiming mechanics

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INVALID-STAKE (err u402))
(define-constant ERR-ROUND-CLOSED (err u403))
(define-constant ERR-ROUND-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-CLAIMED (err u405))
(define-constant ERR-NOT-WINNER (err u406))
(define-constant ERR-NO-STAKE (err u407))
(define-constant ERR-DIVISION-BY-ZERO (err u408))

;; Data Vars
(define-data-var protocol-admin principal tx-sender)
(define-data-var round-nonce uint u0)
(define-data-var platform-fee-percent uint u2) ;; 2% protocol fee

;; Prediction Rounds
(define-map rounds 
    uint 
    {
        creator: principal,
        target-block: uint,
        outcome-type: (string-ascii 20), ;; "tx-count", "block-fees"
        status: (string-ascii 10),       ;; "open", "resolved"
        total-pool: uint,
        outcome: (optional uint)
    }
)

;; User Stakes
(define-map stakes 
    { round-id: uint, user: principal }
    { amount: uint, prediction: uint }
)

;; Dynamic Pool Splits for outcome calculations
(define-map prediction-pools
    { round-id: uint, prediction: uint }
    uint
)

;; Tracking Claim Status
(define-map claimed-users
    { round-id: uint, user: principal }
    bool
)

;; Public Functions

(define-public (create-round (target-block uint) (outcome-type (string-ascii 20)))
    (let
        (
            (round-id (var-get round-nonce))
        )
        (asserts! (is-eq tx-sender (var-get protocol-admin)) ERR-NOT-AUTHORIZED)
        (map-set rounds round-id {
            creator: tx-sender,
            target-block: target-block,
            outcome-type: outcome-type,
            status: "open",
            total-pool: u0,
            outcome: none
        })
        (var-set round-nonce (+ round-id u1))
        (ok round-id)
    )
)

(define-public (place-stake (round-id uint) (amount uint) (prediction uint))
    (let
        (
            (round (unwrap! (map-get? rounds round-id) ERR-ROUND-NOT-FOUND))
            (current-pool-staked (default-to u0 (map-get? prediction-pools { round-id: round-id, prediction: prediction })))
        )
        (asserts! (is-eq (get status round) "open") ERR-ROUND-CLOSED)
        (asserts! (> amount u0) ERR-INVALID-STAKE)
        
        ;; Transfer stake to contract
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; Update stake maps
        (map-set stakes { round-id: round-id, user: tx-sender } { amount: amount, prediction: prediction })
        (map-set rounds round-id (merge round { total-pool: (+ (get total-pool round) amount) }))
        
        ;; Update the pool split map
        (map-set prediction-pools 
            { round-id: round-id, prediction: prediction } 
            (+ current-pool-staked amount)
        )
        
        (ok true)
    )
)

(define-public (resolve-round (round-id uint) (final-outcome uint))
    (let
        (
            (round (unwrap! (map-get? rounds round-id) ERR-ROUND-NOT-FOUND))
        )
        (asserts! (is-eq tx-sender (var-get protocol-admin)) ERR-NOT-AUTHORIZED)
        (map-set rounds round-id (merge round { 
            status: "resolved", 
            outcome: (some final-outcome) 
        }))
        (ok true)
    )
)

(define-public (claim-reward (round-id uint))
    (let
        (
            (stake (unwrap! (map-get? stakes { round-id: round-id, user: tx-sender }) ERR-NO-STAKE))
            (round (unwrap! (map-get? rounds round-id) ERR-ROUND-NOT-FOUND))
            (final-outcome (unwrap! (get outcome round) ERR-ROUND-CLOSED))
            (total-winning-stakes (unwrap! (map-get? prediction-pools { round-id: round-id, prediction: final-outcome }) ERR-DIVISION-BY-ZERO))
        )
        ;; Asserts
        (asserts! (is-eq (get status round) "resolved") ERR-ROUND-CLOSED)
        (asserts! (is-eq (get prediction stake) final-outcome) ERR-NOT-WINNER)
        (asserts! (is-none (map-get? claimed-users { round-id: round-id, user: tx-sender })) ERR-ALREADY-CLAIMED)
        
        (let
            (
                (user-stake (get amount stake))
                (total-pool (get total-pool round))
                
                ;; Calculate proportional share: (user-stake * total-pool) / total-winning-stakes
                (raw-share (/ (* user-stake total-pool) total-winning-stakes))
                (platform-fee (/ (* raw-share (var-get platform-fee-percent)) u100))
                (payout-amount (- raw-share platform-fee))
                (admin-addr (var-get protocol-admin))
            )
            
            ;; Mark claimed
            (map-set claimed-users { round-id: round-id, user: tx-sender } true)
            
            ;; Transfer protocol fee to admin
            (if (> platform-fee u0)
                (try! (as-contract (stx-transfer? platform-fee tx-sender admin-addr)))
                false
            )
            
            ;; Transfer reward to winner
            (try! (as-contract (stx-transfer? payout-amount tx-sender tx-sender)))
            
            (ok payout-amount)
        )
    )
)

;; Read-only Functions

(define-read-only (get-round (round-id uint))
    (map-get? rounds round-id)
)

(define-read-only (get-user-stake (round-id uint) (user principal))
    (map-get? stakes { round-id: round-id, user: user })
)

(define-read-only (get-prediction-pool (round-id uint) (prediction uint))
    (default-to u0 (map-get? prediction-pools { round-id: round-id, prediction: prediction }))
)

(define-read-only (has-user-claimed (round-id uint) (user principal))
    (default-to false (map-get? claimed-users { round-id: round-id, user: user }))
)

(define-read-only (get-latest-round-id)
    (var-get round-nonce)
)
