import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {CurrVolumeDay} from "./currVolumeDay.model"
import {CurrLiquidity} from "./currLiquidity.model"
import {CurrPrice} from "./currPrice.model"

@Entity_()
export class Currency {
  constructor(props?: Partial<Currency>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @Column_("text", {nullable: false})
  currencyName!: string

  @Column_("int4", {nullable: true})
  decimals!: number | undefined | null

  @OneToMany_(() => CurrVolumeDay, e => e.currency)
  volumeDayHistory!: CurrVolumeDay[]

  @OneToMany_(() => CurrLiquidity, e => e.currency)
  liquidityHistory!: CurrLiquidity[]

  @OneToMany_(() => CurrPrice, e => e.currency)
  priceHistory!: CurrPrice[]
}
