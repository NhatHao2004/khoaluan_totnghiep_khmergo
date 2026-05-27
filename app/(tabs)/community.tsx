import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Firestore from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_GAP = SCREEN_HEIGHT * 0.3;

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
  const insets = useSafeAreaInsets();
  const { openPostId } = useLocalSearchParams();

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const commentInputRef = React.useRef<TextInput>(null);
  const commentsListRef = React.useRef<FlatList>(null);

  // Tự động mở bình luận từ thông báo
  useEffect(() => {
    if (openPostId) {
      setActivePostId(openPostId as string);
      setModalVisible(true);

      // Xóa params sau khi đã mở để có thể trigger lại lần sau
      router.setParams({ openPostId: undefined });

      // Tự động cuộn xuống cuối sau khi dữ liệu tải (đợi 1 chút cho animation modal và dữ liệu FB)
      setTimeout(() => {
        commentsListRef.current?.scrollToEnd({ animated: true });
      }, 1000);
    }
  }, [openPostId]);

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastY = useSharedValue(-100);

  // Reply States
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string | null>(null);
  const [replyToUserId, setReplyToUserId] = useState<string | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type as any);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? 70 : 60, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-100, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 4000);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-120, 60], [0, 1]),
  }));

  // Render Toast Component Helper
  const renderToast = () => {
    if (!showToast) return null;
    return (
      <Animated.View style={[
        styles.toastContainer,
        animatedToastStyle,
        {
          backgroundColor: toastType === 'success' ? '#10B981' : (toastType === 'error' ? '#FF453A' : '#007AFF'),
          borderColor: 'rgba(255,255,255,0.2)'
        }
      ]}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={toastType === 'success' ? "checkmark" : (toastType === 'error' ? "close" : "information")} size={18} color="#FFF" />
        </View>
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    );
  };

  // Manual Keyboard Control for Android stability
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const sendNotification = async (receiverId: string, type: 'like' | 'comment' | 'reply', postId: string, message: string) => {
    if (!user || user.uid === receiverId) return; // Không tự thông báo cho chính mình

    try {
      await Firestore.addDoc(Firestore.collection(db, 'notifications'), {
        toUserId: receiverId,
        senderId: user.uid,
        fromUserName: user.name || 'Người dùng',
        senderAvatar: user.avatar || 'https://i.pravatar.cc/150?u=me',
        type,
        postId,
        message,
        isRead: false,
        createdAt: Firestore.serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      triggerToast("Vui lòng cấp quyền truy cập ảnh trong cài đặt", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const asset = result.assets[0];
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
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
        await Firestore.updateDoc(Firestore.doc(db, 'posts', editingPostId), {
          content: createPostText.trim(),
          image: base64Image,
          imageAspectRatio: imageRatio || 1,
        });
        triggerToast("Đã cập nhật bài viết");
      } else {
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
      setTimeout(() => {
        setIsSubmittingPost(false);
      }, 500);
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

      if (!isLiked) {
        const postSnap = await Firestore.getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          sendNotification(postData.userId, 'like', postId, "đã thích bài viết của bạn");
        }
      }
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
    const currentComment = commentText.trim();
    
    // Reset input immediately for perceived speed
    setCommentText('');
    setReplyToId(null);
    setReplyToName(null);
    setReplyToUserId(null);
    Keyboard.dismiss();

    try {
      const commentData = {
        userId: user.uid,
        user: user.name || 'Người dùng',
        avatar: user.avatar || 'https://i.pravatar.cc/150?u=me',
        text: currentComment,
        parentId: replyToId || null,
        createdAt: Firestore.serverTimestamp()
      };

      // Run Firestore updates in parallel
      await Promise.all([
        Firestore.addDoc(Firestore.collection(db, 'posts', activePostId, 'comments'), commentData),
        Firestore.updateDoc(Firestore.doc(db, 'posts', activePostId), {
          comments: Firestore.increment(1)
        })
      ]);

      // Background notification logic
      const postSnap = await Firestore.getDoc(Firestore.doc(db, 'posts', activePostId));
      if (postSnap.exists()) {
        const postData = postSnap.data();
        if (replyToId && replyToUserId) {
          sendNotification(replyToUserId, 'reply', activePostId, `đã trả lời bình luận của bạn: "${currentComment.substring(0, 30)}..."`);
        } else {
          sendNotification(postData.userId, 'comment', activePostId, `đã bình luận bài viết của bạn: "${currentComment.substring(0, 30)}..."`);
        }
      }
    } catch (error) {
      triggerToast("Lỗi gửi bình luận", "error");
      // Re-set text if error so user doesn't lose it
      setCommentText(currentComment);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyToId(comment.id);
    setReplyToName(comment.user);
    setReplyToUserId(comment.userId);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activePostId) return;
    try {
      const childDocsQuery = Firestore.query(
        Firestore.collection(db, 'posts', activePostId, 'comments'),
        Firestore.where('parentId', '==', commentId)
      );
      const childDocs = await Firestore.getDocs(childDocsQuery);
      const totalToDelete = childDocs.size + 1;

      const batch = Firestore.writeBatch(db);
      batch.delete(Firestore.doc(db, 'posts', activePostId, 'comments', commentId));
      childDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      await Firestore.updateDoc(Firestore.doc(db, 'posts', activePostId), {
        comments: Firestore.increment(-totalToDelete)
      });

      triggerToast("Đã xóa bình luận");
    } catch (error) {
      triggerToast("Lỗi khi xóa bình luận", "error");
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
      {(!isModalVisible && !isCreateModalVisible) && renderToast()}

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

      {/* Modal: Tạo/Sửa bài viết */}
      <Modal animationType="slide" transparent={true} statusBarTranslucent={true} visible={isCreateModalVisible} onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {renderToast()}
          <TouchableOpacity
            style={{ height: TOP_GAP }}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setCreateModalVisible(false);
            }}
          />
          <View style={[styles.modalContent, { flex: 1, paddingBottom: keyboardHeight || (insets.bottom + 15) }]}>
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

            <ScrollView 
              style={styles.createPostContent} 
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
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
              
              <View style={{ flex: 1 }} />

              {(selectedImage && keyboardHeight === 0) && (
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
            </ScrollView>

            {keyboardHeight === 0 && (
              <View style={[styles.createPostActions, { paddingBottom: insets.bottom + 5 }]}>
                <TouchableOpacity style={styles.attachAction} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#1877F2" />
                  <Text style={styles.attachActionText}>Ảnh</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCreateModalVisible(false);
                    setIsEditingPost(false);
                    setEditingPostId(null);
                    setCreatePostText('');
                    setSelectedImage(null);
                    setBase64Image(null);
                  }}
                >
                  <Ionicons name="close" size={28} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Bình luận */}
      <Modal animationType="slide" transparent={true} statusBarTranslucent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {renderToast()}
          <TouchableOpacity
            style={{ height: TOP_GAP }}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setModalVisible(false);
            }}
          />
          <View style={[styles.modalContent, { flex: 1, paddingBottom: keyboardHeight || (insets.bottom + 12) }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderTitleBox}>
                <Text style={styles.modalTitle}>Bình luận ({posts.find(p => p.id === activePostId)?.comments || 0})</Text>
                <TouchableOpacity onPress={() => {
                  Keyboard.dismiss();
                  setModalVisible(false);
                }}><Ionicons name="close" size={28} color="#1A1A1A" /></TouchableOpacity>
              </View>
            </View>

            <FlatList
              ref={commentsListRef}
              data={comments}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
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
                          <Text style={styles.commentUser} numberOfLines={0}>
                            {displayCommentName}
                            {isReply && item.parentId && (
                              <Text style={{ fontWeight: 'normal' }}>
                                {"  "}
                                <Ionicons name="caret-forward-sharp" size={12} color="#666" />
                                {"  "}
                                <Text style={styles.repliedToUser}>
                                  {comments.find(c => c.id === item.parentId)?.user || 'Người dùng'}
                                </Text>
                              </Text>
                            )}
                          </Text>
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
              ListEmptyComponent={<View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: '#999' }}>Hãy là người đầu tiên bình luận</Text></View>}
            />

            {replyToName && (
              <View style={styles.replyBar}>
                <Text style={styles.replyBarText}>Đang trả lời: <Text style={{ fontWeight: '800' }}>{replyToName}</Text></Text>
                <TouchableOpacity onPress={() => { setReplyToId(null); setReplyToName(null); setReplyToUserId(null); }}>
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + 12 }]}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder="Viết bình luận..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={submitComment} disabled={!commentText.trim() || isAddingComment}>
                {isAddingComment ? <ActivityIndicator size="small" color="#1877F2" /> : <Ionicons name="send" size={25} color={commentText.trim() ? "#1877F2" : "#1877F2"} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Post Options Bottom Sheet */}
      <Modal animationType="slide" transparent={true} statusBarTranslucent={true} visible={isOptionsModalVisible} onRequestClose={() => setOptionsModalVisible(false)}>
        <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
          <View style={[styles.optionsContent, { paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.optionsHandle} />
            <TouchableOpacity style={styles.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedPost) handleEditPost(selectedPost); }}>
              <View style={styles.optionIconContainer}><Ionicons name="create-outline" size={24} color="#0051ffff" /></View>
              <View><Text style={styles.optionText}>Chỉnh sửa bài viết</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedPost) handleDeletePost(selectedPost.id, selectedPost.userId); }}>
              <View style={styles.optionIconContainer}><Ionicons name="trash-outline" size={24} color="#FF3B30" /></View>
              <View><Text style={[styles.optionText, { color: '#FF3B30' }]}>Xóa bỏ bài viết</Text></View>
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
    top: 0,
    left: 15,
    right: 15,
    zIndex: 10000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 25
  },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 15, flex: 1, letterSpacing: 0.3 },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  screenTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 5, paddingBottom: 30 },
  postContainer: { paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0' },
  headerInfo: { marginLeft: 12, flex: 1, marginRight: 10, minWidth: 0 },
  userName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', paddingVertical: 2, paddingRight: 15, flexShrink: 1 },
  postTime: { fontSize: 14, color: '#666', marginTop: 2 },
  postContent: { fontSize: 16, color: '#1A1A1A', marginBottom: 15, paddingVertical: 2 },
  postImage: { width: '100%', borderRadius: 24, backgroundColor: '#F0F0F0', marginBottom: 15 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCount: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  modalHeader: { alignItems: 'center', paddingVertical: 12 },
  modalHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E0E0E0', marginBottom: 10 },
  modalHeaderTitleBox: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0' },
  commentsList: { paddingHorizontal: 20, paddingBottom: 20 },
  commentItem: { flexDirection: 'row', marginBottom: 15 },
  commentBody: { marginLeft: 10, flex: 1, minWidth: 0 },
  commentContentArea: { paddingVertical: 2 },
  commentUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' },
  repliedToUser: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', paddingVertical: 1 },
  commentUser: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', paddingVertical: 1, paddingRight: 10, flexShrink: 1 },
  commentText: { fontSize: 14, color: '#1A1A1A', paddingVertical: 2 },
  commentTime: { fontSize: 12, color: '#999' },
  footerActionText: { fontSize: 12, fontWeight: '700', color: '#666', paddingVertical: 5, paddingRight: 12, minWidth: 55 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF' },
  commentInput: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, maxHeight: 110 },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEE' },
  replyBarText: { fontSize: 14, color: '#666', flex: 1, marginRight: 10 },
  sendBtn: { marginLeft: 10, width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  emptyText: { marginTop: 35, fontSize: 16, color: '#999', fontWeight: '500' },
  createPostContent: { flexGrow: 1 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingTop: 10 },
  userNameInModal: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginLeft: 12, paddingRight: 15, flex: 1 },
  createPostInput: { fontSize: 18, color: '#1A1A1A', textAlignVertical: 'top', flex: 1, minHeight: 150, paddingHorizontal: 20 },
  previewImageContainer: { position: 'relative', marginBottom: 12, paddingHorizontal: 20 },
  previewImage: { width: '100%', borderRadius: 20, backgroundColor: '#F0F0F0' },
  removeImageBtn: { position: 'absolute', top: 10, right: 30, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15 },
  createPostActions: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center', backgroundColor: '#FFFFFF' },
  attachAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22, gap: 8 },
  attachActionText: { fontSize: 14, fontWeight: '700', color: '#1877F2', marginRight: 2 },
  closeModalBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, backgroundColor: '#FFF0F0' },
  optionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  optionsContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 10, paddingBottom: 30 },
  optionsHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginVertical: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, paddingHorizontal: 25, width: '100%' },
  optionIconContainer: { width: 30, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
});