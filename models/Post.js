const mongoose = require('mongoose');
const { model, Schema } = mongoose;

//cover = files

const PostSchema = new Schema({
    title: String, 
    summary: String, 
    content: String,
    cover: String,
    author:{type:Schema.Types.ObjectId, ref: 'User'},
}, {
    timestamps: true,
});

const PostModel = model('Post', PostSchema);

module.exports = PostModel;