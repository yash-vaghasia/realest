import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'projects', limit: 10, depth: 0 })
  for (const d of r.docs) {
    console.log(
      [d.slug.padEnd(36), `₹${d.price_from_inr?.toLocaleString('en-IN')}`.padEnd(15), `band=${d.budget_band}`.padEnd(20), `status=${d.status}`].join(
        '  ',
      ),
    )
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
