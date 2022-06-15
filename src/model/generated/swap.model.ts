import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Currency} from "./currency.model"

@Entity_()
export class Swap {
  constructor(props?: Partial<Swap>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  timestamp!: bigint | undefined | null

  @Index_()
  @ManyToOne_(() => Currency, {nullable: true})
  fromCurrency!: Currency | undefined | null

  @Index_()
  @ManyToOne_(() => Currency, {nullable: true})
  toCurrency!: Currency | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  fromAmount!: bigint | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  toAmount!: bigint | undefined | null
}
