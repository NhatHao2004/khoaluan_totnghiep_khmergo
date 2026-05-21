import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Firestore from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Comment {
  id: string;
  user: string;
  avatar: string;
  userId: string;
  text: string;
  time: any;
  parentId?: string | null;
}

interface Post {
  id: string;
  user: string;
  userAvatar: string;
  userId: string;
  time: any;
  content: string;
  image?: string;
  imageAspectRatio?: number;
  likes: number;
  comments: number;
  likedBy: string[];
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // States
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [createPostText, setCreatePostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const commentInputRef = React.useRef<TextInput>(null);

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastY = useSharedValue(-100);

  // Reply States
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withSpring(Platform.OS === 'ios' ? 60 : 40, { damping: 15 });

    setTimeout(() => {
      toastY.value = withSpring(-100);
      setTimeout(() => setShowToast(false), 500);
    }, 2500);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1]),
  }));

  // Subscribe to real-time posts
  useEffect(() => {
    const q = Firestore.query(Firestore.collection(db, 'posts'), Firestore.orderBy('createdAt', 'desc'));
    const unsubscribe = Firestore.onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Vừa xong'
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to comments
  useEffect(() => {
    if (!activePostId) return;
    const q = Firestore.query(
      Firestore.collection(db, 'posts', activePostId, 'comments'),
      Firestore.orderBy('createdAt', 'asc')
    );
    const unsubscribe = Firestore.onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Vừa xong'
      })) as Comment[];
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [activePostId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        const asset = result.assets[0];
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }], // Tăng gấp đôi độ phân giải lên 1000px
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true } // Nâng chất lượng lên 85% để ảnh sắc nét
        );
        const base64Str = `data:image/jpeg;base64,${manipResult.base64}`;
        if (base64Str.length > 950000) {
          triggerToast("Ảnh quá nặng, hãy chọn ảnh khác", "error");
          return;
        }
        setSelectedImage(manipResult.uri);
        setBase64Image(base64Str);
        if (manipResult.width && manipResult.height) {
          setImageRatio(manipResult.width / manipResult.height);
        }
      } catch (error) {
        triggerToast("Lỗi xử lý hình ảnh", "error");
      }
    }
  };

  const submitPost = async () => {
    if (!user || (!createPostText.trim() && !base64Image)) return;
    setIsSubmittingPost(true);
    try {
      if (isEditingPost && editingPostId) {
        // Mode: Edit
        await Firestore.updateDoc(Firestore.doc(db, 'posts', editingPostId), {
          content: createPostText.trim(),
          image: base64Image,
          imageAspectRatio: imageRatio || 1,
        });
        triggerToast("Đã cập nhật bài viết");
      } else {
        // Mode: Create
        await Firestore.addDoc(Firestore.collection(db, 'posts'), {
          userId: user.uid,
          user: user.name || 'Người dùng',
          userAvatar: user.avatar || 'https://i.pravatar.cc/150?u=me',
          content: createPostText.trim(),
          image: base64Image,
          imageAspectRatio: imageRatio || 1,
          likes: 0,
          comments: 0,
          likedBy: [],
          createdAt: Firestore.serverTimestamp()
        });
        triggerToast("Đã đăng bài viết");
      }

      // Reset everything
      setCreatePostText('');
      setSelectedImage(null);
      setBase64Image(null);
      setImageRatio(null);
      setEditingPostId(null);
      setIsEditingPost(false);
      setCreateModalVisible(false);
    } catch (error) {
      triggerToast("Thao tác thất bại", "error");
    } finally {
      // Artificial delay to let the nice spinner be seen longer
      setTimeout(() => {
        setIsSubmittingPost(false);
      }, 3000);
    }
  };

  const handleLike = async (postId: string, likedBy: string[] = []) => {
    if (!user) {
      triggerToast("Vui lòng đăng nhập", "error");
      return;
    }
    const postRef = Firestore.doc(db, 'posts', postId);
    const isLiked = likedBy.includes(user.uid);
    try {
      await Firestore.updateDoc(postRef, {
        likes: isLiked ? Firestore.increment(-1) : Firestore.increment(1),
        likedBy: isLiked ? Firestore.arrayRemove(user.uid) : Firestore.arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = (id: string) => {
    if (!user) {
      triggerToast("Vui lòng đăng nhập để bình luận", "error");
      return;
    }
    setActivePostId(id);
    setModalVisible(true);
  };

  const submitComment = async () => {
    if (!user || !commentText.trim() || !activePostId) return;
    setIsAddingComment(true);
    try {
      await Firestore.addDoc(Firestore.collection(db, 'posts', activePostId, 'comments'), {
        userId: user.uid,
        user: user.name || 'Người dùng',
        avatar: user.avatar || 'https://i.pravatar.cc/150?u=me',
        text: commentText.trim(),
        parentId: replyToId || null,
        createdAt: Firestore.serverTimestamp()
      });
      await Firestore.updateDoc(Firestore.doc(db, 'posts', activePostId), {
        comments: Firestore.increment(1)
      });
      setCommentText('');
      setReplyToId(null);
      setReplyToName(null);
    } catch (error) {
      triggerToast("Lỗi gửi bình luận", "error");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyToId(comment.id);
    setReplyToName(comment.user);
    // Removed automatic @username insertion for a cleaner input experience
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleCommentLongPress = (comment: Comment) => {
    if (!user || user.uid !== comment.userId || !activePostId) return;

    Alert.alert(
      "Tùy chọn bình luận",
      "Bạn muốn làm gì với bình luận này",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Sửa bình luận", onPress: () => handleEditComment(comment) },
        { text: "Xóa bình luận", style: "destructive", onPress: () => handleDeleteComment(comment.id) }
      ]
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activePostId) return;
    try {
      // 1. Tìm tất cả bình luận con (phản hồi)
      const childDocsQuery = Firestore.query(
        Firestore.collection(db, 'posts', activePostId, 'comments'),
        Firestore.where('parentId', '==', commentId)
      );
      const childDocs = await Firestore.getDocs(childDocsQuery);
      const totalToDelete = childDocs.size + 1; // Cha + các con

      // 2. Sử dụng Batch để xóa đồng thời
      const batch = Firestore.writeBatch(db);

      // Xóa bình luận cha
      batch.delete(Firestore.doc(db, 'posts', activePostId, 'comments', commentId));

      // Xóa bình luận con
      childDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Thực thi xóa
      await batch.commit();

      // 4. Cập nhật lại tổng số bình luận của bài viết
      await Firestore.updateDoc(Firestore.doc(db, 'posts', activePostId), {
        comments: Firestore.increment(-totalToDelete)
      });

      const msg = totalToDelete > 1 ? `Đã xóa bình luận và ${childDocs.size} phản hồi` : "Đã xóa bình luận";

      // 1. Đóng Modal ngay lập tức
      setModalVisible(false);
      setActivePostId(null);

      // 2. Chờ hiệu ứng đóng hoàn tất rồi mới hiện thông báo ở màn hình chính
      setTimeout(() => {
        triggerToast(msg);
      }, 400);
    } catch (error) {
      console.error("Error deleting comment tree:", error);
      triggerToast("Lỗi khi xóa bình luận", "error");
    }
  };

  const handleEditComment = (comment: Comment) => {
    // Để đơn giản và đẹp, tôi sẽ đưa nội dung cũ vào ô nhập liệu chính và đổi chế độ
    // Hoặc dùng Alert.prompt nếu muốn nhanh
    if (Platform.OS === 'ios') {
      Alert.prompt(
        "Sửa bình luận",
        "Nhập nội dung mới:",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Lưu",
            onPress: async (text: string | undefined) => {
              if (text && text.trim() && activePostId) {
                try {
                  await Firestore.updateDoc(Firestore.doc(db, 'posts', activePostId, 'comments', comment.id), {
                    text: text.trim()
                  });
                  triggerToast("Đã cập nhật bình luận");
                } catch (e) {
                  triggerToast("Lỗi cập nhật", "error");
                }
              }
            }
          }
        ],
        "plain-text",
        comment.text
      );
    } else {
      // Android: Đưa nội dung vào TextInput chính hoặc dùng Alert (Android ko hỗ trợ Prompt của native)
      setCommentText(comment.text);
      // Bạn có thể thêm 1 state để biết đang edit, nhưng hiện tại hãy để người dùng tự gửi lại sẽ tạo comment mới 
      // hoặc tôi có thể sửa logic submitComment để kiểm tra isEditing.
      Alert.alert("Thông báo", "Vui lòng sửa nội dung ở khung nhập liệu và gửi lại");
    }
  };

  const handlePostOptions = (post: Post) => {
    if (!user || user.uid !== post.userId) return;
    setSelectedPost(post);
    setOptionsModalVisible(true);
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setIsEditingPost(true);
    setCreatePostText(post.content);
    if (post.image) {
      setSelectedImage(post.image);
      setBase64Image(post.image);
      setImageRatio(post.imageAspectRatio || 1);
    } else {
      setSelectedImage(null);
      setBase64Image(null);
      setImageRatio(null);
    }
    setCreateModalVisible(true);
  };

  const handleDeletePost = async (postId: string, postUserId: string) => {
    if (!user || user.uid !== postUserId) return;

    Alert.alert(
      "Xóa bài viết",
      "Hành động này không thể hoàn tác",
      [
        { text: "Quay lại", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await Firestore.deleteDoc(Firestore.doc(db, 'posts', postId));
              triggerToast("Đã xóa bài viết");
            } catch (error) {
              triggerToast("Lỗi khi xóa bài viết", "error");
            }
          }
        }
      ]
    );
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = user ? item.likedBy?.includes(user.uid) : false;
    const isMyPost = user?.uid === item.userId;

    // Luôn lấy ảnh/tên mới nhất nếu là bài viết của mình
    const displayAvatar = (isMyPost && user?.avatar) ? user.avatar : item.userAvatar;
    const displayName = (isMyPost && user?.name) ? user.name : item.user;

    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.postTime}>{item.time}</Text>
          </View>
          {isMyPost && (
            <TouchableOpacity onPress={() => handlePostOptions(item)} style={{ padding: 5 }}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={[styles.postImage, { aspectRatio: item.imageAspectRatio || 1 }]}
          />
        )}
        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionItem} onPress={() => handleLike(item.id, item.likedBy)}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#F43F5E" : "#1A1A1A"} />
              <Text style={styles.actionCount}>{item.likes || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => handleComment(item.id)}>
              <Ionicons name="chatbubble-outline" size={20} color="#1A1A1A" />
              <Text style={styles.actionCount}>{item.comments || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {showToast && (
        <Animated.View style={[styles.toastContainer, animatedToastStyle, { backgroundColor: toastType === 'success' ? '#10B981' : '#EF4444' }]}>
          <Ionicons name={toastType === 'success' ? "checkmark-circle" : "alert-circle"} size={20} color="#FFF" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      <View style={styles.screenHeader}>
        <View style={{ width: 36 }} />
        <Text style={styles.screenTitle}>Cộng đồng</Text>
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => {
            if (!user) {
              Alert.alert(
                "Yêu cầu đăng nhập",
                "Đăng nhập để sử dụng tính năng này",
                [
                  { text: "Hủy", style: "cancel" },
                  { text: "Đăng nhập", onPress: () => router.push('/login') }
                ]
              );
              return;
            }
            setCreateModalVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, posts.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#EEE" />
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          </View>
        }
      />

      <Modal animationType="slide" transparent={true} statusBarTranslucent={true} visible={isCreateModalVisible} onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderTitleBox}>
                <Text style={styles.modalTitle}>{isEditingPost ? 'Sửa bài viết' : 'Tạo bài viết'}</Text>
                <TouchableOpacity
                  onPress={submitPost}
                  disabled={!createPostText.trim() && !base64Image || isSubmittingPost}
                  style={{ minWidth: 80, alignItems: 'flex-end', paddingVertical: 10 }}
                >
                  <View style={{ minWidth: 30, alignItems: 'center', justifyContent: 'center', paddingRight: 10 }}>
                    {isSubmittingPost ? (
                      <ActivityIndicator size="small" color="#1877F2" />
                    ) : (
                      <Text style={{
                        color: (createPostText.trim() || base64Image) ? '#1877F2' : '#CCC',
                        fontSize: 16,
                        fontWeight: '700',
                      }}>
                        {isEditingPost ? 'Cập nhật' : 'Đăng bài'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={[]}
              renderItem={null}
              ListHeaderComponent={
                <View style={styles.createPostContent}>
                  <View style={styles.userInfoRow}>
                    <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=me' }} style={styles.commentAvatar} />
                    <Text style={styles.userNameInModal}>{user?.name || 'Người dùng'}</Text>
                  </View>
                  <TextInput
                    style={styles.createPostInput}
                    placeholder="Chia sẻ khoảnh khắc đẹp..."
                    placeholderTextColor="#999"
                    multiline
                    autoFocus
                    value={createPostText}
                    onChangeText={setCreatePostText}
                    scrollEnabled={false}
                  />
                  {selectedImage && (
                    <View style={styles.previewImageContainer}>
                      <Image
                        source={{ uri: selectedImage }}
                        style={[styles.previewImage, { aspectRatio: imageRatio || 1 }]}
                      />
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setSelectedImage(null); setBase64Image(null); setImageRatio(null); }}>
                        <Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.6)" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              }
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            />

            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.attachAction} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#1877F2" />
                <Text style={styles.attachActionText}>Ảnh</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => {
                  setCreateModalVisible(false);
                  setIsEditingPost(false);
                  setEditingPostId(null);
                  setCreatePostText('');
                  setSelectedImage(null);
                  setBase64Image(null);
                }}
              >
                <Ionicons name="close" size={28} color="#ff0000ff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} statusBarTranslucent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderTitleBox}>
                <Text style={styles.modalTitle}>Bình luận ({posts.find(p => p.id === activePostId)?.comments || 0})</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#1A1A1A" /></TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              renderItem={({ item }) => {
                const isMyComment = user?.uid === item.userId;
                const displayCommentAvatar = (isMyComment && user?.avatar) ? user.avatar : item.avatar;
                const displayCommentName = (isMyComment && user?.name) ? user.name : item.user;
                const isReply = !!item.parentId;

                return (
                  <View style={[styles.commentItem, isReply && { marginLeft: 45 }]}>
                    <Image source={{ uri: displayCommentAvatar }} style={[styles.commentAvatar, isReply && { width: 32, height: 32 }]} />
                    <View style={styles.commentBody}>
                      <View style={styles.commentContentArea}>
                        <View style={styles.commentUserRow}>
                          <Text style={styles.commentUser}>{displayCommentName}</Text>
                          {isReply && item.parentId && (
                            <>
                              <Ionicons name="caret-forward-sharp" size={12} color="#666" style={{ marginHorizontal: 4, marginTop: 2 }} />
                              <Text style={styles.repliedToUser}>
                                {comments.find(c => c.id === item.parentId)?.user || 'Người dùng'}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text style={styles.commentText}>{item.text}</Text>
                      </View>

                      <View style={styles.commentFooter}>
                        <Text style={styles.commentTime}>{item.time}</Text>
                        <TouchableOpacity onPress={() => handleReply(item)} style={{ marginLeft: 12 }}>
                          <Text style={styles.footerActionText}>Trả lời</Text>
                        </TouchableOpacity>
                        {isMyComment && (
                          <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={{ marginLeft: 1 }}>
                            <Text style={styles.footerActionText}>Xóa</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#000000ff' }}>Hãy là người đầu tiên bình luận</Text></View>}
            />
            {replyToName && (
              <View style={styles.replyBar}>
                <Text style={styles.replyBarText}>Đang trả lời: <Text style={{ fontWeight: '800' }}>{replyToName}</Text></Text>
                <TouchableOpacity onPress={() => { setReplyToId(null); setReplyToName(null); }}>
                  <Ionicons name="close-circle" size={24} color="#ff0000ff" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputContainer}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder="Viết bình luận..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={submitComment} disabled={!commentText.trim() || isAddingComment}>
                {isAddingComment ? <ActivityIndicator size="small" color="#006effff" /> : <Ionicons name="send" size={28} color={commentText.trim() ? "#006effff" : "#006effff"} />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Post Options Bottom Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isOptionsModalVisible}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.optionsContent}>
            <View style={styles.optionsHandle} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                setOptionsModalVisible(false);
                if (selectedPost) handleEditPost(selectedPost);
              }}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="create-sharp" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.optionText, { color: '#ffffffff' }]}>Chỉnh sửa bài viết</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                setOptionsModalVisible(false);
                if (selectedPost) handleDeletePost(selectedPost.id, selectedPost.userId);
              }}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="trash-sharp" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.optionText, { color: '#ffffffff' }]}>Xóa bỏ bài viết</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 10 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 12 },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  screenTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 5, paddingBottom: 30 },
  postContainer: { paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0' },
  headerInfo: { marginLeft: 12, flex: 1, marginRight: 10 },
  userName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', paddingVertical: 2 },
  postTime: { fontSize: 14, color: '#666', marginTop: 2 },
  postContent: { fontSize: 16, color: '#1A1A1A', marginBottom: 15, paddingVertical: 2 },
  postImage: { width: '100%', borderRadius: 24, backgroundColor: '#F0F0F0', marginBottom: 15 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCount: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  modalHeader: { alignItems: 'center', paddingVertical: 12 },
  modalHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E0E0E0', marginBottom: 10 },
  modalHeaderTitleBox: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0' },
  commentsList: { paddingHorizontal: 20, paddingBottom: 20 },
  commentItem: { flexDirection: 'row', marginBottom: 15 },
  commentBody: { marginLeft: 10, flex: 1 },
  replyConnector: {
    position: 'absolute',
    left: -20,
    top: -15,
    bottom: 25,
    width: 2,
    backgroundColor: '#EAEAEA',
    borderBottomLeftRadius: 10,
  },
  commentRow: { flexDirection: 'row', alignItems: 'center' },
  commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  commentContentArea: { paddingVertical: 2 },
  commentUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  repliedToUser: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', paddingVertical: 1 },
  commentUser: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', paddingVertical: 1 },
  commentText: { fontSize: 14, color: '#1A1A1A', paddingVertical: 2 },
  commentTime: { fontSize: 12, color: '#999' },
  footerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    paddingVertical: 5,
    paddingRight: 12,
    minWidth: 55,
  },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF' },
  commentInput: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEE' },
  replyBarText: { fontSize: 14, color: '#666' },
  sendBtn: { marginLeft: 10, width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  emptyText: { marginTop: 35, fontSize: 16, color: '#999', fontWeight: '500' },
  createPostContent: { padding: 20, flex: 1 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userNameInModal: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginLeft: 12, flex: 1 },
  createPostInput: { fontSize: 18, color: '#1A1A1A', textAlignVertical: 'top', flex: 1 },
  previewImageContainer: { marginTop: 15, position: 'relative' },
  previewImage: { width: '100%', borderRadius: 20, backgroundColor: '#F0F0F0' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15 },
  createPostActions: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center' },
  attachAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22, gap: 8 },
  attachActionText: { fontSize: 14, fontWeight: '700', color: '#1877F2', marginRight: 2 },
  closeModalBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, backgroundColor: '#FFF0F0' },

  // Options Modal (Bottom Sheet)
  optionsOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', paddingBottom: 20 },
  optionsContent: { backgroundColor: '#1A1A1A', borderRadius: 24, marginHorizontal: 15, paddingHorizontal: 10, paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 15 },
  optionsHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginVertical: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, width: '100%' },
  optionIconContainer: { width: 32, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  optionSubText: { fontSize: 12, color: '#666', marginTop: 2 },
});
