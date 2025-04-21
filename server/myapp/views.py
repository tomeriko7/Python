from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404,redirect
from .models import Article, UserProfile, Comment,Category,Tag
from .serializers import RegisterSerializer, LoginSerializer, UserProfileSerializer,TagSerializer
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from django.http import HttpResponse
from .serializers import ArticleSerializer, CommentSerializer
from .serializers import CategorySerializer
from rest_framework.decorators import action
from django.db.models import Q
from django.db.models import Count
from rest_framework_simplejwt.tokens import RefreshToken

# Create your views here.

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to perform certain actions
    """
    def has_object_permission(self, request, view, obj):
        # Check if user is admin
        try:
            is_admin = request.user.userprofile.user_type in ['admin','owner']
            if is_admin:
                return True
        except:
            pass

        #Check if user the user or author
        if hasattr(obj,'user'):
            return obj.user == request.user
        elif hasattr(obj, 'author'):
            return obj.author == request.user
        return False

# Authentication Views
class RegisterView(generics.CreateAPIView):
    """ API endpoint for registering new users """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'register.html'
    
    def get(self, request, *args, **kwargs):
        # Handle GET request to display the registration form
        return Response({}, template_name=self.template_name)
    
    def perform_create(self, serializer):
        # Override to return the user object
        return serializer.save()
    
    def post(self, request, *args, **kwargs):
        # Debug info
        print("Content type:", request.content_type)
        print("Request data:", request.data)
        
        # Check if this is a form submission or API request
        if request.content_type == 'application/json':
            # Handle JSON API request
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = self.perform_create(serializer)
                # Generate token for the user
                refresh = RefreshToken.for_user(user)
                # Return both user data and token
                response_data = {
                    'user': serializer.data,
                    'token': str(refresh.access_token)
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                print("Validation errors:", serializer.errors)
                # מחזיר את השגיאות בפורמט JSON - לשימוש המפתח
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Handle regular form submission
            serializer = self.get_serializer(data=request.POST)
            if serializer.is_valid():
                self.perform_create(serializer)        
                return redirect('/auth/login/')
            
            return Response({'serializer': serializer, 'errors': serializer.errors}, 
                           template_name=self.template_name)

class ValidationErrorsView(APIView):
    """API endpoint to show possible validation errors and their format"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        """Return examples of all possible validation errors"""
        error_examples = {
            "username": [
                "A user with that username already exists.",
                "This field is required.",
                "This field may not be blank."
            ],
            "email": [
                "Enter a valid email address.",
                "A user with this email already exists.",
                "This field is required."
            ],
            "password": [
                "This field is required.",
                "This password is too short. It must contain at least 8 characters.",
                "This password is too common."
            ]
        }
        return Response(error_examples)

class LoginView(APIView):
    """ API endpoint for user login """
    permission_classes = [permissions.AllowAny]
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'login.html'
    
    def get(self, request):
        # Handle GET request to display the login form
        return Response({}, template_name=self.template_name)
    
    def post(self, request):
        try:
            # Debug info to help troubleshoot content type issues
            print("Content type:", request.content_type)
            print("Request data:", request.data)
            
            serializer = LoginSerializer(data=request.data)
            
            # Check if serializer is valid without raising exception to get detailed errors
            if not serializer.is_valid():
                print("Validation errors:", serializer.errors)
                # For API requests, return detailed validation errors
                if request.content_type and 'json' in request.content_type.lower():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                # For form submissions, show the login form with error
                return Response({'serializer': serializer, 'errors': serializer.errors}, 
                              template_name=self.template_name)
            
            # Get the user from the serializer
            user = serializer.validated_data['user']
            
            # Generate token for the user
            refresh = RefreshToken.for_user(user)
            
            # Check if this is a form submission or API request
            # More robust content type checking - look for 'json' anywhere in content type
            is_api_request = request.content_type and 'json' in request.content_type.lower()
            
            if is_api_request or request.accepted_renderer.format == 'json':
                # Return user data and token for API requests
                response_data = {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    },
                    'token': str(refresh.access_token)
                }
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                # For form submissions, redirect to home
                return redirect('/home/')
        except Exception as e:
            # More detailed error handling
            error_message = str(e)
            print(f"Login error: {error_message}")
            
            # For API requests, return JSON error response
            if request.content_type and 'json' in request.content_type.lower():
                return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
            
            # For form submissions, show the login form with error
            return Response({'error': 'Invalid username or password'}, 
                          template_name=self.template_name)


class LogoutView(APIView):
    """ API endpoint for user logout """
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        # Get the user's token and delete it
        try:
            request.user.auth_token.delete()
            return Response(status=status.HTTP_200_OK)
        except:
            pass
        
class homeView(APIView):
    """ API endpoint for retrieving the home page content """
    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [TemplateHTMLRenderer]
    template_name = 'home.html'
    def get(self, request):
        try:
            # Get or create the user's profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # Get recent articles if the Article model is being used
            try:
                articles = Article.objects.all().order_by('-created_at')[:6]
            except:
                articles = []
                
            # Return the data as a dictionary for the template context
            return Response({
                'profile': UserProfileSerializer(profile).data,
                'articles': articles
            })
        except Exception as e:
            print(f"Error in homeView: {e}")
            import traceback
            traceback.print_exc()
            # Return a simple response for debugging
            return Response({
                'error': 'An error occurred while loading your profile. Please try again.'
            }, status=500)

# UserProfile Views

class UserProfileViewSet(viewsets.ModelViewSet):
    """ API endpoint for managing user profiles """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]  # Allow any user to manage profiles
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """ Get the current user's profile """
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        user_profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(user_profile)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """ Allow partial updates for changing user role """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='change-user-type')
    def change_user_type(self, request, pk=None):
        """ Change a user's type (regular, author, admin) """
        # Get the profile
        profile = self.get_object()
        
        # Validate the requested user type
        requested_type = request.data.get('user_type')
        valid_types = [choice[0] for choice in UserProfile.USER_TYPE_CHOICES]
        
        if not requested_type:
            return Response(
                {"error": "user_type is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if requested_type not in valid_types:
            return Response(
                {"error": f"Invalid user_type. Must be one of: {', '.join(valid_types)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the profile
        profile.user_type = requested_type
        profile.save()
        
        # Return updated profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='user-types')
    def get_user_types(self, request):
        """ Get all available user types """
        types = [{"value": choice[0], "label": choice[1]} for choice in UserProfile.USER_TYPE_CHOICES]
        return Response(types)

class ArticleViewSet(viewsets.ModelViewSet):
    """ API endpoint for managing articles """
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """ Get all comments for an article """
        article = self.get_object()
        comments = Comment.objects.filter(article=article).order_by('-created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_articles(self, request):
        """ Get all articles created by the authenticated user """
        articles = Article.objects.filter(author=request.user).order_by('-created_at')
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """ Search articles by title, content, or author """
        query = request.query_params.get('q', '')
        if query:
            articles = Article.objects.filter(
                Q(title__icontains=query) | 
                Q(content__icontains=query) | 
                Q(author__username__icontains=query)|
                Q(tags__name__icontains=query)
            ).distinct().order_by('-created_at')
            
            serializer = self.get_serializer(articles, many=True)
            return Response(serializer.data)
        return Response({"error": "Search query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)


class ArticleListView(generics.ListAPIView):
    """ View for listing articles with filtering """
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'article_list.html'

    def get_queryset(self):
        queryset = Article.objects.all().order_by('-created_at')
        category_slug = self.request.query_params.get('category')
        if category_slug:
            category = get_object_or_404(Category, slug=category_slug)
            queryset = queryset.filter(category=category)
        tag_slug = self.request.query_params.get('tag')
        if tag_slug:
            queryset = queryset.filter(tags__slug=tag_slug)

        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(author__username__icontains=search_query)
            )
        return queryset
        
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # For API requests
        if request.accepted_renderer.format == 'json':
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        
        # For template requests
        categories = Category.objects.all()
        
        return Response({
            'articles': queryset,
            'categories': categories,
            'search_query': request.query_params.get('search', ''),
            'current_category': request.query_params.get('category', ''),
            'current_tag': request.query_params.get('tag', '')
        })


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """ View for retrieving, updating and deleting an article """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]
    lookup_field = 'slug'  # Use slug for lookups
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'article_detail.html'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get comments for this article
        comments = Comment.objects.filter(article=instance).order_by('-created_at')
        comments_serializer = CommentSerializer(comments, many=True)
        
        # For API requests
        if request.accepted_renderer.format == 'json':
            return Response({
                    'article': serializer.data,
                    'comments': comments_serializer.data
            })
        
        # For template requests    
        from django.db.models import Count
        categories = Category.objects.annotate(article_count=Count('article'))
        
        return Response({
            'article': instance,
            'comments': comments,
            'categories': categories,
            'can_edit': request.user.is_authenticated and (
                request.user == instance.author or 
                hasattr(request.user, 'userprofile') and 
                request.user.userprofile.user_type in ['admin', 'owner']
            )
        })
    
    def perform_update(self, serializer):
        article = serializer.save()
        
        # Handle tags if present in request data
        tag_ids = self.request.data.get('tag_ids', None)
        if tag_ids is not None:
            if isinstance(tag_ids, str):
                # Handle comma-separated string
                tag_ids = [int(id.strip()) for id in tag_ids.split(',') if id.strip().isdigit()]
            article.tags.set(Tag.objects.filter(id__in=tag_ids))
        return article
        
    def get_permissions(self):
        # Anyone can view, but only owner/admin can update or delete
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        return super().get_permissions()

class ArticleCreateView(generics.CreateAPIView):
    """ View for creating a new article """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'article_form.html'

    def get(self, request, *args, **kwargs):
        # For template requests
        return Response({
            'categories': Category.objects.all(),
            'tags': Tag.objects.all(),
            'article': None
        })

    def perform_create(self, serializer):
        # Set the current user as the author
        article = serializer.save(author=self.request.user)
        
        # Handle tags if present in request data
        tag_ids = self.request.data.get('tag_ids', [])
        if tag_ids:
            if isinstance(tag_ids, str):
                # Handle comma-separated string
                tag_ids = [int(id.strip()) for id in tag_ids.split(',') if id.strip().isdigit()]
            article.tags.set(Tag.objects.filter(id__in=tag_ids))
        
        return article
        
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            self.perform_create(serializer)
            
            # For API requests
            if request.accepted_renderer.format == 'json':
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            # For template requests
            return redirect('article-detail', slug=serializer.instance.slug)
        
        # For API requests with errors
        if request.accepted_renderer.format == 'json':
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # For template requests with errors
        return Response({
            'categories': Category.objects.all(),
            'tags': Tag.objects.all(),
            'article': None,
            'errors': serializer.errors
        })
    

class ArticleUpdateView(generics.UpdateAPIView):
    """ View for updating an existing article """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = 'slug'  # Use slug for lookups
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'article_form.html'
    
    def get(self, request, *args, **kwargs):
        article = self.get_object()
        
        # For template requests
        return Response({
            'article': article,
            'categories': Category.objects.all(),
            'tags': Tag.objects.all()
        })
    
    def perform_update(self, serializer):
        article = serializer.save()
        
        # Handle tags if present in request data
        tag_ids = self.request.data.get('tag_ids', None)
        if tag_ids is not None:
            if isinstance(tag_ids, str):
                # Handle comma-separated string
                tag_ids = [int(id.strip()) for id in tag_ids.split(',') if id.strip().isdigit()]
            article.tags.set(Tag.objects.filter(id__in=tag_ids))
        
        return article
        
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
        
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            
            # For API requests
            if request.accepted_renderer.format == 'json':
                return Response(serializer.data)
                
            # For template requests
            return redirect('article-detail', slug=instance.slug)
        
        # For API requests with errors
        if request.accepted_renderer.format == 'json':
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # For template requests with errors
        return Response({
            'article': instance,
            'categories': Category.objects.all(),
            'tags': Tag.objects.all(),
            'errors': serializer.errors
        })


class ArticleDeleteView(generics.DestroyAPIView):
    """ View for deleting an article """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = 'slug'  # Use slug for lookups
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'article_confirm_delete.html'
    
    def get(self, request, *args, **kwargs):
        article = self.get_object()
        return Response({'article': article})
    
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        
        # For API requests
        if request.accepted_renderer.format == 'json':
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        # For template requests
        return redirect('article-list')
    
    def post(self, request, *args, **kwargs):
        # For handling form submissions
        return self.delete(request, *args, **kwargs)


class TagViewSet(viewsets.ModelViewSet):
    """ API endpoint for managing tags """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    # All authenticated users can manage tags
    
    @action(detail=True, methods=['get'])
    def articles(self, request, slug=None):
        """ Get all articles with a specific tag """
        tag = self.get_object()
        articles = Article.objects.filter(tags=tag).order_by('-created_at')
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)
        
class TagListView(generics.ListAPIView):
    """ View for listing tags """
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'tags/tag_list.html'
    
    def get_queryset(self):
        # Returns all tags with article count
        return Tag.objects.annotate(article_count=Count('article')).order_by('-article_count')
    
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # API request
        if request.accepted_renderer.format == 'json':
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        
        # Template request
        return Response({
            'tags': queryset
        })
    
class TagDetailView(generics.RetrieveAPIView):
    """ View for showing articles by tag """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'tags/tag_detail.html'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get articles with this tag
        articles = Article.objects.filter(tags=instance).order_by('-created_at')
        
        # API request
        if request.accepted_renderer.format == 'json':
            article_serializer = ArticleSerializer(articles, many=True)
            return Response({
                'tag': serializer.data,
                'articles': article_serializer.data
            })
        
        # Get popular tags
        popular_tags = Tag.objects.annotate(article_count=Count('article')).order_by('-article_count')[:10]
        
        # Template request
        return Response({
            'tag': instance,
            'articles': articles,
            'popular_tags': popular_tags,
        })

class CategoryViewSet(viewsets.ModelViewSet):
    """ API endpoint for managing categories """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    # All authenticated users can manage categories

class CategoryListView(generics.ListAPIView):
    """ View for listing categories """
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    renderer_classes = [TemplateHTMLRenderer, JSONRenderer]
    template_name = 'categories/category_list.html'
    
    def get_queryset(self):
        # Returns all categories with article count
        return Category.objects.annotate(article_count=Count('article')).order_by('-article_count')
    
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # API request
        if request.accepted_renderer.format == 'json':
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        
        # Template request
        return Response({
            'categories': queryset
        })

class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing comments"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]  # Any user can perform CRUD operations on comments
    
    def get_queryset(self):
        """
        Filter comments by article or parent comment
        """
        queryset = Comment.objects.all().order_by('-created_at')
        article_id = self.request.query_params.get('article', None)
        
        if article_id:
            queryset = queryset.filter(article_id=article_id)
            
        # If filtering by parent, return only top-level comments (no replies)
        parent = self.request.query_params.get('parent', None)
        if parent == 'null':
            queryset = queryset.filter(parent__isnull=True)
            
        return queryset
    
    def perform_create(self, serializer):
        """
        Save the current user as the comment author
        """
        serializer.save(user=self.request.user)
        
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a specific comment
        """
        comment = self.get_object()
        comment.is_approved = True
        comment.save()
        return Response({'status': 'comment approved'})
        
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a specific comment
        """
        comment = self.get_object()
        comment.is_approved = False
        comment.save()
        return Response({'status': 'comment rejected'})
        
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Return all comments pending approval
        """
        pending_comments = Comment.objects.filter(is_approved=False)
        serializer = self.get_serializer(pending_comments, many=True)
        return Response(serializer.data)

# Comment management views with templates
class CommentListView(APIView):
    """View for listing all comments"""
    renderer_classes = [TemplateHTMLRenderer]
    template_name = 'comments/comment_list.html'
    permission_classes = [permissions.AllowAny]  # No permission required
    
    def get(self, request, format=None):
        comments = Comment.objects.all().order_by('-created_at')
        return Response({
            'comments': comments,
            'title': 'All Comments'
        })


class PendingCommentsView(APIView):
    """View for listing pending comments"""
    renderer_classes = [TemplateHTMLRenderer]
    template_name = 'comments/comment_list.html'
    permission_classes = [permissions.AllowAny]  # No permission required
    
    def get(self, request, format=None):
        comments = Comment.objects.filter(is_approved=False).order_by('-created_at')
        return Response({
            'comments': comments,
            'title': 'Pending Comments',
            'pending': True
        })