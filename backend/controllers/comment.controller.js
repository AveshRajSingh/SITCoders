import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";

const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim() || typeof content !== "string") {
      return res
        .status(400)
        .json({ message: "Content is required and must be a string." });
    }
    const postId = req.params.postId;
    const userId = req.user._id;

    if (!postId || !userId) {
      return res
        .status(400)
        .json({ message: "Post ID and User ID are required." });
    }

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Create the comment
    const newComment = await Comment.create({
      content: content.trim(),
      post: postId,
      user: userId,
      parentComment: null, // Assuming this is a top-level comment
    });

    res
      .status(201)
      .json({ message: "Comment created successfully", comment: newComment });
  } catch (error) {
    console.error("Error creating comment:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createReply = async (req, res) => {
  try {
    const { content } = req.body;
    const trimedContent = content?.trim();
    if (!trimedContent || typeof trimedContent !== "string") {
      return res
        .status(400)
        .json({ message: "Content is required and must be a string." });
    }
    const commentId = req.params.commentId;
    const userId = req.user._id;
    if (!commentId || !userId) {
      return res
        .status(400)
        .json({ message: "Comment ID and User ID are required." });
    }
    // Check if the comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Comment not found." });
    }
    // Create the reply
    const newReply = await Comment.create({
      content: trimedContent,
      post: parentComment.post,
      user: userId,
      parentComment: commentId,
    });

    res
      .status(201)
      .json({ message: "Reply created successfully", comment: newReply });
  } catch (error) {
    console.error("Error creating reply:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getParentComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required." });
    }
    
    // Fetch parent comments for the given post
    const parentComments = await Comment.find({
      post: postId,
      parentComment: null,
    })
      .select("-__v")
      .populate("user", "fullName username profilePicture")
      .sort({ createdAt: -1 });

    // Fetch replies for each parent comment
    const commentsWithReplies = await Promise.all(
      parentComments.map(async (comment) => {
        const replies = await Comment.find({
          parentComment: comment._id
        })
          .select("-__v")
          .populate("user", "fullName username profilePicture")
          .sort({ createdAt: 1 });
        
        return {
          ...comment.toObject(),
          replies: replies
        };
      })
    );

    if (!commentsWithReplies || commentsWithReplies.length === 0) {
      return res.status(200).json({ message: "No comments found.", parentComment: [] });
    }
    
    res.status(200).json({ parentComment: commentsWithReplies });
  } catch (error) {
    console.error("Error fetching parent comment:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteComment = async (req, res) => {};

const updateComment = async (req, res) => {};
 


export { createComment, createReply, getParentComment };
