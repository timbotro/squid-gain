import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Swap {
  constructor(props?: any) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  timestamp!: bigint | undefined | null

  @Column_("text", {nullable: true})
  fromCurrency!: string | undefined | null

  @Column_("text", {nullable: true})
  toCurrency!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  fromAmount!: bigint | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  toAmount!: bigint | undefined | null
}
