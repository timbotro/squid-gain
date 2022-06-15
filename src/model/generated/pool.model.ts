import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {PoolVolumeDay} from "./poolVolumeDay.model"
import {PoolLiquidity} from "./poolLiquidity.model"

@Entity_()
export class Pool {
  constructor(props?: Partial<Pool>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  currency0!: string

  @Column_("text", {nullable: false})
  currency1!: string

  @OneToMany_(() => PoolVolumeDay, e => e.pool)
  volumeDaysDay!: PoolVolumeDay[]

  @OneToMany_(() => PoolLiquidity, e => e.pool)
  liquidityHistory!: PoolLiquidity[]
}
