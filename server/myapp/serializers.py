from rest_framework import serializers
from .models import UserProfile, Category, Tag, Article, Comment
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        read_only_fields = ['id']

class UserBasicSerializer(serializers.ModelSerializer):
    """Simple User serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username']
        
class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'user_type', 'bio', 'profile_pic', 'created_at', 'updated_at')
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'min_length': 8}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        UserProfile.objects.create(user=user, user_type='regular')
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True)
    token = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    
    def validate(self, data):
        username = data.get('username', '')
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Ensure at least one of username or email is provided
        if not username and not email:
            raise serializers.ValidationError({
                'non_field_errors': ['Either username or email must be provided']
            })
            
        if not password:
            raise serializers.ValidationError({
                'password': ['Password is required']
            })
        
        # Try to authenticate with username if provided
        user = None
        if username:
            user = authenticate(username=username, password=password)
        
        # If username authentication failed or wasn't provided, try with email
        if not user and email:
            try:
                # Find the user with this email
                user_obj = User.objects.get(email=email)
                # Try to authenticate with the username
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        if not user:
            raise serializers.ValidationError({
                'non_field_errors': ['Invalid credentials']
            })
        
        # Use JWT token instead of auth token
        refresh = RefreshToken.for_user(user)
        
        data['token'] = str(refresh.access_token)
        data['user_id'] = user.id
        data['email'] = user.email
        data['user'] = user
        
        return data

class TagSerializer(serializers.ModelSerializer):
    """ Serializer for tags """
    class Meta:
        model = Tag
        fields = ('id', 'tag_name', 'slug')
        read_only_fields = ('slug',)

class CategorySerializer(serializers.ModelSerializer):
    """ Serializer for categories """
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'slug')
        read_only_fields = ('slug',)


class ArticleSerializer(serializers.ModelSerializer):
    """" Serializer for articles """
    author = UserSerializer(read_only=True)
    category_name=serializers.ReadOnlyField(source='category.name')
    tags = TagSerializer(many=True, read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=True)

    class Meta:
        model = Article
        fields = ('id', 'title', 'content', 'author', 'category', 'category_name', 'tags', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        """Handle the creation of an article with tags"""
        # Get tags from the request data, not validated_data
        tags = self.context['request'].data.get('tags', [])
        article = Article.objects.create(**validated_data)
        
        if tags:
            article.tags.set(tags)
        
        return article
    
    def update(self, instance, validated_data):
        """Handle the update of an article with tags"""
        # Get tags from the request data, not validated_data
        tags = self.context['request'].data.get('tags', None)
        
        # Update the article fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update tags if provided
        if tags is not None:
            instance.tags.set(tags)
        
        instance.save()
        return instance


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for the Comment model"""
    user = UserBasicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    is_reply = serializers.ReadOnlyField()
    reply_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'user', 'content', 'created_at',
            'parent', 'is_approved', 'is_reply', 'reply_count', 'replies'
        ]
        read_only_fields = ['created_at', 'is_approved']
    
    def get_replies(self, obj):
        """Get approved replies for a comment, sorted by creation date"""
        if self.context.get('include_replies', True) and hasattr(obj, 'replies'):
            replies = obj.replies.filter(is_approved=True).order_by('created_at')
            # Pass context with include_replies=False to prevent infinite recursion
            serializer = CommentSerializer(
                replies, 
                many=True, 
                context={'include_replies': False}
            )
            return serializer.data
        return []
    
    def create(self, validated_data):
        """Create a new comment"""
        # Make sure the article exists
        article = validated_data.get('article')
        if not article:
            raise serializers.ValidationError("Article is required")
        
        # If this is a reply, make sure the parent comment exists and belongs to the same article
        parent_id = validated_data.get('parent')
        if parent_id:
            try:
                parent = Comment.objects.get(id=parent_id)
                if parent.article.id != article.id:
                    raise serializers.ValidationError("Parent comment must belong to the same article")
            except Comment.DoesNotExist:
                raise serializers.ValidationError("Parent comment does not exist")
        
        return Comment.objects.create(**validated_data)


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a comment with minimal fields"""
    class Meta:
        model = Comment
        fields = ['article', 'content', 'parent']
    
    def create(self, validated_data):
        """Create a new comment and set the current user"""
        user = self.context['request'].user
        return Comment.objects.create(user=user, **validated_data)