from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet)
router.register(r'articles', views.ArticleViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'comments', views.CommentViewSet)

urlpatterns = [
    # API endpoints through router
    path('api/', include(router.urls)),
    
    # Authentication
    path('api/auth/register/', views.RegisterView.as_view(), name='register'),
    path('api/auth/login/', views.LoginView.as_view(), name='login'),
    path('api/auth/logout/', views.LogoutView.as_view(), name='logout'),
    
    # API URLs for debugging
    path('api/debug/validation-errors/', views.ValidationErrorsView.as_view(), name='validation_errors'),
    
    # Main pages
    path('', views.homeView.as_view(), name='home'),  
    
    # Article views with templates
    path('articles/', views.ArticleListView.as_view(), name='article-list'),
    path('articles/create/', views.ArticleCreateView.as_view(), name='article-create'),
    path('articles/<slug:slug>/', views.ArticleDetailView.as_view(), name='article-detail'),
    path('articles/<slug:slug>/edit/', views.ArticleUpdateView.as_view(), name='article-update'),
    path('articles/<slug:slug>/delete/', views.ArticleDeleteView.as_view(), name='article-delete'),
    
    # Tag views
    path('tags/', views.TagListView.as_view(), name='tag-list'),
    path('tags/<slug:slug>/', views.TagDetailView.as_view(), name='tag-detail'),
    
    # Comment management views
    path('comments/', views.CommentListView.as_view(), name='comment-list'),
    path('comments/pending/', views.PendingCommentsView.as_view(), name='comment-pending'),
]