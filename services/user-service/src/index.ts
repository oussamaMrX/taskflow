import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'


const app = express()
const PORT = process.env.PORT || 3001


app.use(cors())
app.use(express.json())

app.get('/health',(req,res)=>{
    res.json({status:'ok',service:'user-service'})
})

app.listen(PORT,()=>{
    console.log(`user service running on ${PORT}`)
})