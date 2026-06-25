;; Yield Strategy Trait for BlockYield (Clarity 2, epoch 2.5)
;; Defines the interface that all yield strategies must conform to.
;; This enables trait-based dynamic dispatch in blockyield.clar.
(define-trait yield-strategy-trait
    (
        (deposit (uint) (response bool uint))
        (withdraw (uint) (response bool uint))
    )
)
