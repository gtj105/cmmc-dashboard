import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const sql = postgres(connectionString, { max: 10 })
export default sql
