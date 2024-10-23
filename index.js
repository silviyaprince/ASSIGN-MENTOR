import express from "express";

import { MongoClient } from "mongodb";
const PORT = 9000;
const app = express();
app.use(express.json());

const MONGO_URL = "mongodb://127.0.0.1:27017";

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("mongodb is connected");
  return client;
}
const client = await createConnection();

app.get("/", (req, res) => {
  res.send("hello everyone");
});

//create a mentor
app.post("/createMentor", async (req, res) => {
  const newMentor = req.body;
  const result = await client
    .db("Student")
    .collection("mentor")
    .insertMany(newMentor);
  res.send(result);
  console.log(newMentor);
});

//create a student
app.post("/createStudent", async (req, res) => {
  const newStudent = req.body;
  const result = await client
    .db("Student")
    .collection("studentdata")
    .insertMany(newStudent);
  res.send(result);
});

//assign  students to a mentor
app.post("/assignStudentsToMentor", async (req, res) => {
  const { studentIds, mentorId } = req.body;
  if (!Array.isArray(studentIds)) {
    return res.status(400).json({ error: "studentIds must be an array" });
  }
  const students = await client
    .db("Student")
    .collection("studentdata")
    .find({ id: { $in: studentIds } })
    .toArray();
  if (students.length !== studentIds.length) {
    return res.status(404).json({ error: "some students were not found" });
  }
  const alreadyAssignedStudents = students.filter(
    (student) => student.mentorId
  );
  if (alreadyAssignedStudents.length > 0) {
    return res
      .status(400)
      .json({ error: "some students are already assigned to a mentor" });
  }

  const unassignedStudents = students.filter((student) => !student.mentorId);

  await client
    .db("Student")
    .collection("studentdata")
    .updateMany(
      { id: { $in: unassignedStudents.map((s) => s.id) } },
      { $set: { mentorId: mentorId } }
    );
  res.status(200).json({ message: "mentor assigned successfully" });
});

//assign or change mentor for a particular student
app.post("/changeMentorForStudent", async (req, res) => {
  const { studentId, mentorId } = req.body;
  const student = await client
    .db("Student")
    .collection("studentdata")
    .findOne({ id: studentId });
  if (!student) {
    res.status(404).json({ error: "student not found" });
  }
  await client
    .db("Student")
    .collection("studentdata")
    .updateOne({ id: studentId }, { $set: { mentorId: mentorId } });
  res.status(200).json({ message: "mentor changed for student successfully" });
  console.log();
});

//show all students for a particular mentor
app.get("/studentsForMentor/:mentorId", async (req, res) => {
  const mentorId = req.params.mentorId;
  const students = await client
    .db("Student")
    .collection("studentdata")
    .find({ mentorId: mentorId })
    .toArray();
  res.send(students);
});

// getting previous mentorId of the student
app.get("/previousMentorForStudent/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await client
      .db("Student")
      .collection("studentdata")
      .findOne({ id: studentId });
    if (!student) {
      res.status(404).json({ error: "student not found" });
    }
    const previousMentorId = student.mentorId;
    res.send(previousMentorId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log("server started on port", PORT));
