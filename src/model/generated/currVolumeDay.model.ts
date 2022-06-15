import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Currency} from "./currency.model"

@Entity_()
export class CurrVolumeDay {
  constructor(props?: Partial<CurrVolumeDay>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Currency, {nullable: true})
  currency!: Currency | undefined | null

  @Column_("timestamp with time zone", {nullable: true})
  timestamp!: Date | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  volumeDayNative!: bigint | undefined | null

  @Column_("numeric", {nullable: true})
  volumeDayUSD!: number | undefined | null
}
