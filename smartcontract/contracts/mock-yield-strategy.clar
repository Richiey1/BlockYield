;; Mock Yield Strategy for BlockYield - local Clarinet testing only (Clarity 2, epoch 2.5)
;; Implements yield-strategy-trait so tests can exercise deposit/withdraw paths
;; without requiring a live mainnet protocol.
(impl-trait .yield-strategy-trait.yield-strategy-trait)

(define-public (deposit (amount uint))
    (begin
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (ok true)
    )
)

(define-public (withdraw (amount uint))
    (begin
        (try! (as-contract (stx-transfer? amount (as-contract tx-sender) tx-sender)))
        (ok true)
    )
)
