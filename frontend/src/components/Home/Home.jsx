import React, { useState, useEffect } from "react";
import {Link} from "react-router-dom";
import { Navigate } from "react-router-dom";
import {
  FaUserCircle,
  FaFire,
  FaClipboard,
  FaArrowRight,
  FaComments,
  FaPlus,
  FaTimes,
  FaImage,
  FaSpinner,
  FaTrash,
  FaEllipsisV,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { createPost, getAllPosts, deletePost } from "../../services/postApi";
import { verifyIsAdmin } from "../../services/adminApi";
import { toast } from "react-toastify";
import { getComments } from "../../services/commentApi";
import ViewPost from "./ViewPost";

function Home() {
  // Use auth context instead of localStorage
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State for posts
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // State for create post modal
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    content: "",
    tag: "general",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Admin status state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  // Delete post states
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPostMenu, setShowPostMenu] = useState(null);

  // Comments 
  const [comments, setComments] = useState({});
  const [commentLoading, setCommentLoading] = useState(false);
  const [showComments, setShowComments] = useState(null);

  // Check admin status
  useEffect(() => {
    console.log(user)
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user?.email) {
        setAdminLoading(false);
        return;
      }

      try {
        const adminStatus = await verifyIsAdmin(user.email);
        setIsAdmin(adminStatus.isAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchPosts();
    }
    checkAdminStatus();
  }, [isAuthenticated, user]);
  
  // Show loading screen while auth is being checked
  if (authLoading) {
    return (
      <div className="pt-20 min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-orange-500" size={32} />
          <span className="mt-4 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Define available tags based on admin status
  const getAvailableTags = () => {
    const baseTags = [
      { value: "general", label: "General" },
      { value: "query", label: "Query" },
      { value: "project", label: "Project" },
    ];

    const adminTags = [
      { value: "announcement", label: "Announcement" },
      { value: "event", label: "Event" },
    ];

    return isAdmin ? [...baseTags, ...adminTags] : baseTags;
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const data = await getAllPosts(1, 20); // Fetch first 20 posts
      setPosts(data.posts || []);
      
      if (data.posts && data.posts.length > 0) {
        fetchComments(data.posts.map(post => post._id));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts. Please try again.");
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchComments = async (postIds) => {
    if (!postIds || postIds.length === 0) return;

    setCommentLoading(true);
    try {
      const allComments = await Promise.all(
        postIds.map((postId) => getComments(postId))
      );
      const commentsMap = {};
      allComments.forEach((data, index) => {
        commentsMap[postIds[index]] = data.parentComment || [];
      });
      setComments(commentsMap);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      setNewPost({ ...newPost, image: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewPost({ ...newPost, image: null });
    setImagePreview(null);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!newPost.content.trim()) {
      toast.warning("Please add some content to your post");
      return;
    }

    // Check if user is trying to use admin-only tags
    if (["announcement", "event"].includes(newPost.tag) && !isAdmin) {
      toast.error("Only administrators can create announcements and events");
      return;
    }

    setCreateLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", newPost.content);
      formData.append("tag", newPost.tag);

      if (newPost.image) {
        formData.append("postImage", newPost.image);
      }

      await createPost(formData);

      // Reset form
      setNewPost({ content: "", tag: "general", image: null });
      setImagePreview(null);
      setShowCreatePost(false);

      // Refresh posts
      fetchPosts();

      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Check if user can delete a post
  const canDeletePost = (post) => {
    if (!user) return false;

    // User is the author
    const isAuthor = post.author?._id === user._id;

    // User is an admin
    const isAdminUser = isAdmin;

    return isAuthor || isAdminUser;
  };

  const handleDeletePost = async (postId) => {
    setDeleteLoading(postId);

    try {
      await deletePost(postId);

      // Remove post from local state
      setPosts(posts.filter((post) => post._id !== postId));

      // Remove comments for this post
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[postId];
        return newComments;
      });

      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post. Please try again.");
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(null);
      setShowPostMenu(null);
    }
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
  };

  const handleShowComments = (postId) => {
    setShowComments((prev) => (prev === postId ? null : postId));
    if (!comments[postId]) {
      // Fetch comments for this post if not already loaded
      setCommentLoading(true);
      getComments(postId)
        .then((data) => {
          setComments((prev) => ({
            ...prev,
            [postId]: data.parentComment || [],
          }));
        })
        .catch((error) => {
          console.error("Error fetching comments:", error);
          toast.error("Failed to load comments. Please try again.");
        })
        .finally(() => {
          setCommentLoading(false);
        });
    }
  };

  // Get tag display style
  const getTagStyle = (tag) => {
    const styles = {
      query: "bg-blue-100 text-blue-600",
      project: "bg-green-100 text-green-600",
      announcement: "bg-red-100 text-red-600",
      event: "bg-purple-100 text-purple-600",
    };
    return styles[tag] || "bg-gray-100 text-gray-600";
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPostMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Calculate user's post count
  const userPostsCount = posts.filter((post) => post.author?._id === user._id).length;

  return (
    <>
      <div className="pt-20 min-h-screen bg-orange-50">
        <div className="flex flex-col md:flex-row gap-6 md:max-w-[90%] lg:max-w-[80%] mx-0 md:mx-auto md:pb-8 ">
          {/* Main Content Area */}
          <div className="md:w-2/3 h-full flex flex-col gap-4">
            {/* Create Post Button */}
            <div className="bg-white md:rounded-2xl shadow-md border border-orange-100 p-4">
              <button
                disabled={!user.isAdminVerified}
                onClick={() => setShowCreatePost(true)}
                className="w-full flex items-center gap-3 p-4 text-black/50 bg-orange-400/10 outline outline-offset-2 outline-orange-400 rounded-lg font-medium hover:opacity-90 transition-all cursor-text disabled:bg-red-100 disabled:text-red-700"
              >
                {user.isAdminVerified ? (
                <>  
                  <FaPlus />
                  <span>What's on your mind, {user?.username || user?.fullName || "User"}?
                  </span>
                </>  
                )
              : (
                <span>ASK AN ADMIN TO VERIFY YOU!!</span>
              )}
              </button>
            </div>

            {/* Posts Feed */}
            <div className="bg-white md:rounded-2xl shadow-md border border-orange-100 p-6">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 border-orange-100 mb-4">
                Feed
              </h2>

              {postsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <FaSpinner
                    className="animate-spin text-orange-500"
                    size={24}
                  />
                  <span className="ml-2 text-gray-600">Loading posts...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <FaClipboard
                    className="mx-auto mb-4 text-gray-400"
                    size={48}
                  />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-colors"
                    >
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {post.author?.profilePicture?.url ? (
                          <img
                            src={post.author.profilePicture.url}
                            alt="Author"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <FaUserCircle className="w-10 h-10 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {post.author?.fullName ||
                              post.author?.username ||
                              "Unknown User"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                        {post.tag !== "general" && (
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getTagStyle(
                              post.tag
                            )}`}
                          >
                            {post.tag.charAt(0).toUpperCase() +
                              post.tag.slice(1)}
                          </span>
                        )}

                        {/* Post Menu - Only show if user can delete */}
                        {canDeletePost(post) && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPostMenu(
                                  showPostMenu === post._id ? null : post._id
                                );
                              }}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <FaEllipsisV
                                className="text-gray-500"
                                size={14}
                              />
                            </button>

                            {/* Dropdown Menu */}
                            {showPostMenu === post._id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(post._id);
                                    setShowPostMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm"
                                >
                                  <FaTrash size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 mb-3">{post.content}</p>

                      {/* Post Image */}
                      {post.postImage?.url && (
                        <img
                          src={post.postImage.url}
                          alt="Post"
                          className="w-full object-cover rounded-lg mb-3"
                        />
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-end gap-4 text-xs md:text-sm text-gray-500 border-t pt-3">
                        <button 
                          onClick={() => handleShowComments(post._id)}
                          className="flex items-center gap-3 hover:text-orange-500 transition-colors cursor-pointer bg-gray-50 p-2 px-4 rounded-xl outline"
                        >
                          <FaComments /> {comments[post._id]?.length || 0}<FaArrowRight />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:w-1/3 hidden h-full md:flex flex-col gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-300 to-amber-400 blur-sm -z-10 transform scale-110"></div>
                  {user?.profilePicture?.url ? (
                    <img
                      src={user.profilePicture.url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <FaUserCircle className="w-24 h-24 text-gray-400 border-2 border-white shadow-md rounded-full" />
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">
                  {user?.fullName || user?.username || "User"}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-amber-500">
                  <FaFire />
                  <span className="text-gray-700">
                    Popularity:{" "}
                    <span className="font-medium">{user?.popularity || 0}</span>
                  </span>
                </div>
                {/* Show admin badge if user is admin */}
                {!adminLoading && isAdmin && (
                  <div className="mt-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                    Administrator
                  </div>
                )}
                <Link to={"/user-profile"} className="text-center mt-4 w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-all">
                  Your Profile
                </Link>
              </div>
            </div>

            {/* Posts Card */}
            <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaClipboard className="text-amber-500" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Your Posts
                </h3>
              </div>
              <div className="text-gray-600 text-sm">
                {user
                  ? `You have ${userPostsCount} post${userPostsCount === 1 ? '' : 's'}`
                  : "You haven't created any posts yet."}
              </div>
              {user.isAdminVerified && (
                <button
                onClick={() => setShowCreatePost(true)}
                className="mt-4 w-full border border-orange-300 text-orange-500 py-2 rounded-lg font-medium hover:bg-orange-50 transition-all"
              >
                Create New Post
              </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Create New Post
                </h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePost} className="p-6">
              {/* Content Textarea */}
              <div className="mb-4">
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-orange-400 focus:border-orange-500 resize-none outline-none"
                  rows="10"
                  placeholder="Share your thoughts..."
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                {/* Image Upload */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                      <FaImage className="text-gray-600" />
                      <span className="text-sm text-gray-600">
                        Choose Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="mb-4">
                  <select
                    value={newPost.tag}
                    onChange={(e) =>
                      setNewPost({ ...newPost, tag: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-orange-500 focus:border-orange-400 outline-none"
                  >
                    {getAvailableTags().map((tag) => (
                      <option key={tag.value} value={tag.value}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newPost.content.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Post</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <FaTrash className="text-red-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Delete Post
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this post? This will permanently
                remove the post and all its content.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(showDeleteConfirm)}
                  disabled={deleteLoading === showDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading === showDeleteConfirm ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <ViewPost 
            posts={posts}
            comments={comments}
            setComments={setComments}
            setShowComments={setShowComments}
            setCommentLoading={setCommentLoading}
            commentLoading={commentLoading}
            showComments={showComments}
          />
        </div>
      )}
    </>
  );
}

export default Home;
