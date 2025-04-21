from django.db import models
from django.contrib.auth.models import User
# Create your models here.
from django.utils.text import slugify


class UserProfile(models.Model):
    USER_TYPE_CHOICES = (
        ('regular', 'Regular User'),
        ('author', 'Author'),
        ('admin', 'Admin')
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name="User")
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='regular')
    bio = models.TextField(max_length=500, blank=True, verbose_name="Bio")
    profile_pic = models.ImageField(upload_to='profile_pics', blank=True, verbose_name="Profile Picture")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['user']
    
    def __str__(self):
        return f'{self.user.username} Profile'


class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Category Name")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Category Slug")
    description = models.TextField(max_length=500, verbose_name="Category Description")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super(Category, self).save(*args, **kwargs)


class Tag(models.Model):
    tag_name = models.CharField(max_length=100, verbose_name="Tag Name")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Tag Slug")

    class Meta:
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['tag_name']

    def __str__(self):
        return self.tag_name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.tag_name)
        super(Tag, self).save(*args, **kwargs)


class Article(models.Model):
    title = models.CharField(max_length=200, verbose_name="Article Title")
    slug = models.SlugField(max_length=200, unique=True, verbose_name="Article Slug")
    content = models.TextField(verbose_name="Article Content")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Author")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Category")
    tags = models.ManyToManyField(Tag, verbose_name="Tags")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    class Meta:
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super(Article, self).save(*args, **kwargs)


class Comment(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, verbose_name="Article", related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="User")   
    content = models.TextField(verbose_name="Comment Content")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name="Parent Comment")
    is_approved = models.BooleanField(default=True, verbose_name="Is Approved")
    
    class Meta:
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Comment by {self.user.username} on {self.article.title}'
    
    def can_delete(self, user):
        # כל משתמש יכול למחוק כל תגובה
        return True
            
    @property
    def is_reply(self):
        """Check if this comment is a reply to another comment"""
        return self.parent is not None
        
    @property
    def reply_count(self):
        """Count the number of replies to this comment"""
        return self.replies.count()