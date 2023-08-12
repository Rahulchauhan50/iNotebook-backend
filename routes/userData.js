const express = require('express')
const router = express.Router();
const User = require('../modals/user')
const Data = require('../modals/userData')
const fetchuser = require('../middleware/fetchUser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const JWT_SECRET = process.env.JWT_SECRET

router.post('/auth/login',[
    body('email','enter a valid email').isEmail(),
    body('password','please enter passwors length must be alreast').exists(),
],async(req,res)=>{
   try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {email, password} = req.body
    let user = await User.findOne({email})
    if(!user){
        return res.status(401).json({error:"user does not exist"})
    }
    const match = await bcrypt.compare(password ,user.password)
        
    if(!match){
        return res.status(401).json({error:"user does not match"})
    } 
    const data = {
        user:{id: user.id}
    }
    const AuthToken = jwt.sign(data,JWT_SECRET)
    
    res.json({"success":true,user,"authToken":AuthToken})


   } catch (error) {
    res.json({error:error,message:error.message}).status(500)
   }
})

router.post('/auth/signup',[
    body('fristName','enter a valid name least 3 charactors').isLength({ min: 3 }),
    body('email','enter a valid email').isEmail(),
    body('password','passwors length must be alreast').isLength({ min: 5 }),
],async(req,res)=>{
   try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let user = await User.findOne({ email: req.body.email })
    if(user){
        return res.status(401).json({error:"user already exist"})
    }

    const salt = await bcrypt.genSalt(10);
    const SecPass = await bcrypt.hash(req.body.password,salt)
    user = await User.create({
        fristName: req.body.fristName,
        lastName: req.body.lastName,
        profileImage: req.body.profileImage,
        email: req.body.email,
        password: SecPass,
    })
    const data = {
        user:{id: user.id}
    }
    const AuthToken = jwt.sign(data,JWT_SECRET)

    const newFolder = new Data({
            user: user.id,
            folders: [{ "folderName":"New Folder"}],
            notes:[{"folderName":"New Folder","title":"New note","description":"My frist note","content":"Hello world","date":Date.now()}]
          });

    const fristFolder = await newFolder.save()

    res.json({"success":true,"authToken":AuthToken,user,fristFolder})

   } catch (error) {
    res.json({error:error,message:error.message}).status(500)
   }
})

router.post('/auth/getuser',fetchuser,async(req,res)=>{
    try {
        const userId = req.user.id
        const user = await User.findById(userId).select("-password")
        res.send(user)
    } catch (error) {
        res.json({error:error,mesage:"fetchUser error"}).status(500)
    }
})

router.get('/data/get-data',fetchuser,async(req,res)=>{
    try {
        const data = await Data.find({ user: req.user.id });
        res.json(data)
    } catch (error) {
        res.status(500).send("Internal Server Error",error);
    }
   
})

router.post('/data/search-notes', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { folderName, titleSubstring } = req.body;

        const user = await Data.findOne({ user: userId });

        if (!user) {
            return res.status(404).json({ message: "User data not found" });
        }

        const matchingNotes = user.notes.filter(note => {
            return note.folderName === folderName && note.title.includes(titleSubstring);
        });

        if (matchingNotes.length === 0) {
            return res.status(404).json({ message: `No notes found in folder "${folderName}" with title containing "${titleSubstring}"` });
        }

        res.json({ matchingNotes, success: true });
    } catch (error) {
        res.status(500).send("Internal Server Error",error);
    }
});

router.post('/data/notes',fetchuser,async(req,res)=>{
    const { folderName } = req.body;
    try {
        const data = await Data.find({ user: req.user.id });
        const notes = await data[0].notes.filter((note)=>note.folderName===folderName)
        res.json({notes,success:true})
    } catch (error) {
        res.status(500).send("Internal Server Error",error);
    }
   
})

router.post('/data/add-folder',fetchuser,async(req,res)=>{
    try {
        const {folderName} = req.body;
        
        const existingData = await Data.findOne({ user: req.user.id });
        
          try { const existingFolderIndex = await existingData.folders.findIndex(
                (folder) => folder.folderName === folderName);

            if(existingFolderIndex < 0){
            existingData.folders.push({"folderName":folderName});

            const updatedData = await existingData.save();
            res.json({ updatedData ,success:true,action:folderName});
            }else{
                res.json({ message:"folder alreadt exist"});
            }
        }catch{
            const newFolder = new Data({
                folders: [{ folderName}],
                notes:[{}]
            });
            const fristFolder = await newFolder.save()
            res.json({"success":true,"authToken":AuthToken,user,fristFolder})
        }
    
    } catch (error) {
        res.send(error)
    }
   
})

router.post('/data/add-note',fetchuser,async(req,res)=>{
    try {
        const {folderName, title, description} = req.body;

        const existingData = await Data.findOne({ user: req.user.id });
     
        const existingNote= await existingData.notes.find(
            (note) => note.folderName === folderName && note.title===title);

            if(existingNote){
            res.send("Note already exist")
        }else{
            existingData.notes.push({folderName, title, description, content: "", date: Date.now() });
            const updatedData = await existingData.save();
            res.json({ updatedData ,success:true});
        }

    
    } catch (error) {
        res.send(error)
    }

   
})

router.post('/data/add-note-content', fetchuser, async (req, res) => {
    try {
        const { folderName, title, content } = req.body;

        const existingData = await Data.findOne({ user: req.user.id });

        const note = existingData.notes.find(note => note.folderName === folderName && note.title === title);

        if (note) {
            note.content = content;
            note.date = Date.now()
            existingData.markModified('notes'); // Mark the nested array as modified
            await existingData.save();
            res.json({ message: "Note content updated successfully",success:true });
        } else {
            res.json({ message: "Note does not exist in the folder" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/data/update-folder', async (req, res) => {
    try {
        const { oldFolderName, newFolderName } = req.body;

        // Update all notes with the old folder name to the new folder name
        await Data.updateMany(
            { "notes.folderName": oldFolderName },
            { $set: { "notes.$[note].folderName": newFolderName } },
            { arrayFilters: [{ "note.folderName": oldFolderName }], multi: true }
        );

        // Update all folders with the old folder name to the new folder name
        await Data.updateMany(
            { "folders.folderName": oldFolderName },
            { $set: { "folders.$[folder].folderName": newFolderName } },
            { arrayFilters: [{ "folder.folderName": oldFolderName }], multi: true }
        );

        res.json({ message: "Folders and notes updated successfully.", success:true,action:newFolderName });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete('/data/delete-folder', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const {folderNameToDelete} = req.body

        const user = await Data.findOne({ user: userId });

        if (!user) {
            return res.status(404).json({ message: "User data not found" });
        }

        user.folders = user.folders.filter(folder => folder.folderName !== folderNameToDelete);
        user.notes = user.notes.filter(note => note.folderName !== folderNameToDelete);

        const updatedData = await user.save();

        res.json({ message: `Folders and notes with folderName "${folderNameToDelete}" deleted`, updatedData , success:true});
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

router.delete('/data/delete-note', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const {folderName, title} = req.body

        const user = await Data.findOne({ user: userId });

        if (!user) {
            return res.status(404).json({ message: "User data not found" });
        }

        user.notes = user.notes.filter(note => {
            return note.folderName !== folderName || note.title !== title;
        });

        const updatedData = await user.save();

        res.json({ message: `notes "${title}" deleted`, updatedData , success:true, folderName, title});
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router
