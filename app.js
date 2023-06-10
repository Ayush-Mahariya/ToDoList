const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = process.env.PORT || 3001;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://ayushmahariya:Ayusha11@cluster0.tuathop.mongodb.net/todoListDB?retryWrites=true&w=majority", {useNewUrlParser:true});

const itemsSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    }
});
const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
    name: "Welcome to your ToDoList"
});
const item2 = new Item({
    name: "Hit the + to add a new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    Item.find().then((foundItems) => {
        if(foundItems.length === 0){
            Item.insertMany(defaultItems).then(function(){
                console.log("Data inserted")  // Success
            }).catch(function(error){
                console.log(error)      // Failure
            });
            res.redirect("/");
        }
        else{
            res.render("list", {listTitle:"Today", newListItems:foundItems});
        }
    });
});


app.get("/:customListName", function(req, res){
    let customListName = req.params.customListName;
    List.find().then((foundLists) => {
        let flag = false;
        let foundListCopy;
        foundLists.forEach((foundList) => {
            if(foundList.name === customListName){
                flag = true;
                foundListCopy = foundList;
            }
        });
        if(!flag){
            let list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
        }
        else{
                res.render("list", {listTitle: foundListCopy.name, newListItems: foundListCopy.items});
        }
    });
});

app.get("/about", function(req, res){
    res.render("about");
})

app.post("/", function(req, res){
    let itemName = req.body.newItem;
    let listName = req.body.list;
    
    let newItem = new Item({
        name: itemName
    });

    if(listName === "Today"){
        newItem.save();
        res.redirect("/");
    }
    else{
        List.find({name: listName}).then((foundLists) => {
            foundLists[0].items.push(newItem);
            foundLists[0].save();
            res.redirect("/"+listName);
        });
    }
});

app.post("/delete", async function(req, res){
    let checkedItemId = req.body.checkbox;
    let listName = req.body.listName;
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId).then(function(){
            console.log("Data Deleted")  // Success
        }).catch(function(error){
            console.log(error)      // Failure
        });
        res.redirect("/");
    }
    else{
        const filter = { name: listName };
        const update = {$pull: {items:{_id: checkedItemId}}};

        // `doc` is the document _before_ `update` was applied
        let doc = await List.findOneAndUpdate(filter, update);
        // console.log(doc);
        
        doc = await List.findOne(filter);
        // console.log(doc);
        res.redirect("/"+listName);
    }
});

// app.listen(port, function(){
//     console.log("Server Started at port "+ port);
// })
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;