module.exports = class Data1654712286082 {
  name = 'Data1654712286082'

  async up(db) {
    await db.query(`CREATE TABLE "historical_balance" ("id" character varying NOT NULL, "balance" numeric NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "account_id" character varying NOT NULL, CONSTRAINT "PK_74ac29ad0bdffb6d1281a1e17e8" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_383ff006e4b59db91d32cb891e" ON "historical_balance" ("account_id") `)
    await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, "balance" numeric NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "swap" ("id" character varying NOT NULL, "timestamp" numeric, "from_currency" text, "to_currency" text, "from_amount" numeric, "to_amount" numeric, CONSTRAINT "PK_4a10d0f359339acef77e7f986d9" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "liquidity_change" ("id" character varying NOT NULL, "timestamp" numeric NOT NULL, "block_number" integer NOT NULL, "event_idx" integer NOT NULL, "step" integer NOT NULL, "reason" character varying(6) NOT NULL, "currency_zero" text NOT NULL, "currency_one" text NOT NULL, "amount_zero" numeric NOT NULL, "amount_one" numeric NOT NULL, "balance_zero" numeric NOT NULL, "balance_one" numeric NOT NULL, CONSTRAINT "PK_470573b79a4d135580c7e7c8179" PRIMARY KEY ("id"))`)
    await db.query(`ALTER TABLE "historical_balance" ADD CONSTRAINT "FK_383ff006e4b59db91d32cb891e9" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "historical_balance"`)
    await db.query(`DROP INDEX "public"."IDX_383ff006e4b59db91d32cb891e"`)
    await db.query(`DROP TABLE "account"`)
    await db.query(`DROP TABLE "swap"`)
    await db.query(`DROP TABLE "liquidity_change"`)
    await db.query(`ALTER TABLE "historical_balance" DROP CONSTRAINT "FK_383ff006e4b59db91d32cb891e9"`)
  }
}
