import express from "express";

import {MongoClient} from "mongodb";
const PORT=9000;
const app=express();
app.use(express.json())

const MONGO_URL="mongodb://127.0.0.1:27017"

async function createConnection(){
    const client=new MongoClient(MONGO_URL)
await client.connect()
console.log("mongodb is connected")
return client;
}
const client=await createConnection()

app.get("/",(req,res)=>{
    res.send("hello everyone")
})

//create a mentor
app.post("/createMentor",async (req,res)=>{
    const newMentor=req.body;
const result=await client.db("Student").collection("mentor").insertMany(newMentor);
res.send(result)
console.log(newMentor)

})

//create a student
app.post("/createStudent",async(req,res)=>{
    const newStudent=req.body;
    const result=await client.db("Student").collection("studentdata").insertMany(newStudent);
res.send(result)
})

//assign a student to a mentor
app.post("/assignStudentToMentor",async(req,res)=>{
    const{studentId,mentorId}=req.body;
    const student=await client.db("Student").collection("studentdata").findOne({id:studentId})
    if(!student){
        res.status(404).json({error:"student not found"})
    }
    if(student.mentorId){
        res.status(400).json({error:"student is already assigned to a mentor"})
    }

   await client.db("Student").collection("studentdata").updateOne({id:studentId},{$set:{mentorId:mentorId}})
    res.send(student)
   
})

//assign or change mentor for a particular student
app.post("/changeMentorForStudent",async (req,res)=>{
const{studentId,mentorId}=req.body;
const student=await client.db("Student").collection("studentdata").findOne({id:studentId})
if(!student){
    res.status(404).json({error:"student not found"})

}
await client.db("Student").collection("studentdata").updateOne({id:studentId},{$set:{mentorId:mentorId}})
res.status(200).json({message:"mentor changed for student successfully"})
console.log()
})

//show all students for a particular mentor
app.get("/studentsForMentor/:mentorId",async(req,res)=>{
    const mentorId=req.params.mentorId;
    const students=await client.db("Student").collection("studentdata").find({mentorId:mentorId}).toArray();
    res.send(students)
})


app.get("/previousMentorForStudent/:studentId", async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const student = await client.db("Student").collection("students").findOne({ _id: studentId });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const previousMentorId = student.mentorId; // Assuming this field stores the assigned mentor
        return res.status(200).json({ previousMentorId });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});




app.listen(PORT,()=>console.log("server started on port",PORT))



