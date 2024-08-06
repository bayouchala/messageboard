'use strict';

const { text } = require('body-parser');

const BoardModel = require('../models').Board;
const ThreadModel = require('../models').Thread;
const ReplyModel = require('../models').Reply;
module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .post((req, res) => {
    const { text, delete_password } = req.body;
    let board = req.body.board;
    if(!board){
      board = req.params.board;
    }
    const newThread = new ThreadModel({
      text: text,
      delete_password: delete_password,
      replies: [],
    });

   BoardModel.findOne({ name: board})
   .then((Boarddata) => {
    if(!Boarddata){
      const newBoard = new BoardModel({
        name: board,
        threads: [],
      });
      newBoard.threads.push(newThread);
      newBoard.save()
      .then((data) => {
       if(data){
        res.json(data);
          
        }
      }).catch((err) => {
        console.log(err);
        res.send("There was an error saving in post");
      })
    }else {
      Boarddata.threads.push(newThread);
      Boarddata.save()
      .then((data) => {
        if(data){
          res.json(data);
                  }
      }).catch((err) => {
        res.send("There was an error saving in post");
      });
    }
   })
  })
  .get((req, res) => {
    const board = req.params.board;
    BoardModel.findOne({ name: board })
    .then((data) =>{
     if(!data){
      console.log("No board with this name");
       res.json({ error: "No board with name" });
     } else {
      data.threads.sort((a, b) => {
        const dateA = new Date(a.bumped_on);
        const dateB = new Date(b.bumped_on);
        return dateB - dateA;
      });
      const threads = data.threads.map((thread) => {
        const allReply = thread.replies.map((perReply) => {
          const { _id, text, created_on, bumped_on } = perReply;
          return {_id, text, created_on, bumped_on};
        })
        allReply.sort((a, b) => {
        const dateA = new Date(a.bumped_on);
        const dateB = new Date(b.bumped_on);
        return dateB - dateA;
        })
        const threeReplies = [];
        for(let n=3; n >= 1; n--){
          const arrValue = allReply[allReply.length - n];
          if(arrValue != undefined){
            threeReplies.push(arrValue);
          }
        }
        return {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: threeReplies,
          replycount: thread.replies.length,
        };
      })
      res.json(threads);
     }
    }).catch((err) =>{
      console.log("No board with this name");
       res.json({ error: "No board with name" });
    })
  })
  .put((req, res) => {
    const { thread_id } = req.body;   
   let board = req.params.board;
    BoardModel.findOne({ name: board })
    .then((boardData) =>{
      if (!boardData) {
      res.json("error", "Board not found");
      } else {
        let reportedThread = boardData;
        for(let y = 0; y < reportedThread.threads.length; y++){
          if(reportedThread.threads[y].id === thread_id){
            reportedThread.threads[y].reported = true;
            reportedThread.threads[y].bumped_on = new Date();
            break;
          }
        }
        reportedThread.save()
        .then((data) => {
          res.send("reported");
        }).catch((err) => {
          res.send("can not be saved");
        })
      }
    }).catch((err) =>{
      res.json("Board not found");
    })
  })
  .delete((req, res) => {
    console.log("delete", req.body);
    const { thread_id, delete_password } = req.body;
    const board = req.params.board;
    BoardModel.findOne({ name: board })
    .then((boardData) => {
      if(!boardData){
        res.json("Board not found");
      }else {
        let threadToDelete = boardData.threads.id(thread_id);
        if(threadToDelete.delete_password === delete_password){
          threadToDelete.deleteOne();
        }else{
          res.send("incorrect password");
          return;
        }
        boardData.save()
        .then((data) => {
          res.send("success");
        }).catch((err) => {
         res.save("can not be saved");
        })
      }
    })
  })
  app.route('/api/replies/:board')
  .post((req, res) => {
    console.log("thread", req.body);
    const { thread_id, text, delete_password } = req.body;
    const board = req.params.board;
    const date = new Date();
    const newReply = new ReplyModel({
      text: text,
      delete_password: delete_password,
      created_on: date,
      bumped_on: date,
      reported: true,
    });
    BoardModel.findOne({ name: board })
    .then((boardData) => {
      if(!boardData){
        res.json("Board not found");
      }else {
        let threadToAddReplay = boardData;
        
        for(let y = 0; y < threadToAddReplay.threads.length; y++){
          
          if(threadToAddReplay.threads[y].id === thread_id){
            threadToAddReplay.threads[y].bumped_on = date;
            threadToAddReplay.threads[y].replies.push(newReply); 
          }
        }
        
        boardData.save()
        .then((updatedData) => {
          res.json(updatedData);
        }).catch((err) => {
          res.send("could not be saved");
        })
      }
    }).catch((err) =>{
      res.json("Board not found");
    })
  })
  .get((req, res) => {
    const board = req.params.board;
     BoardModel.findOne({ name: board })
    .then((data) => {
     if(!data){
      res.json({error: "No board with this name vvvv"});
     } else {
      const singleThreadArray = [];
      for(let x = 0; x < data.threads.length; x++){
        if(data.threads[x].id == req.query.thread_id){
          singleThreadArray.push(data.threads[x]);
          break;
        }
      }
      const theThread = singleThreadArray.map((thread) => {
        const replies = thread.replies.map((perReply) => {
          const { _id, text, created_on, bumped_on } = perReply;
          return {_id, text, created_on, bumped_on};
        })
        return {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: replies,
          replycount: thread.replies.length,
        }
      })
      res.json(theThread[0]);
     }
    }).catch((err) => {
      res.json({error: "No board with this name"});
    })
  })
  .put((req, res) => {
    const { thread_id, reply_id } = req.body;
    const board = req.params.board;
    BoardModel.findOne({ name: board })
    .then((data) => {
      if(!data){
      res.json({ error: "No board with this name" });
      } else {
        console.log("daataa", data);
        for(let y = 0; y < data.threads.length; y++){
        if(data.threads[y].id === thread_id){
          for(let k = 0; k < data.threads[y].replies.length; k++){
            if(data.threads[y].replies[k].id === reply_id){
              data.threads[y].replies[k].reported = true;
              data.threads[y].replies[k].bumped_on = new Date();
              break;
            }
          }
        }
       }
       
       data.save()
        .then((updatedData) => {
          res.send("reported");
        }).catch((err) => {
          res.send("could not saved");
        })
      }
    }).catch((err) => {
      res.json({ error: "No board with this name" });
    }) 
  })
 .delete((req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;
  const board = req.params.board;
  BoardModel.findOne({ name: board })
  .then((data) => {
     if(!data){
      res.json({ error: "No board with this name"});
     } else {
      for(let y = 0; y < data.threads.length; y++){
      if(data.threads[y].id === thread_id){
        for(let k = 0; k < data.threads[y].replies.length; k++){
          if(data.threads[y].replies[k].id === reply_id){
            if(data.threads[y].replies[k].delete_password === delete_password){
              data.threads[y].replies[k].text = '[deleted]'
              break
            } else{
              res.send("incorrect password");
              return;
            }
          }
        }
      }
     }
     data.save()
      .then((updatedData) => {
        res.send("success");
      }).catch((err) => {
        res.send("could not saved");
      })
     }
  }).catch((err) => {
    res.json({ error: "No board with this name"});
  })
 })
};
