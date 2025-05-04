#!/usr/bin/env python
"""
Database seeding script for PlateVite Blog Platform.
This script creates default users, categories, tags, and sample content.
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'TomerKaravaniDjangoApp.settings')
django.setup()

# Import Django models
from django.contrib.auth.models import User
from myapp.models import UserProfile, Category, Tag, Article, Comment
from django.utils.text import slugify

def create_users():
    """Create default admin and regular users."""
    # Create admin user
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='Admin123!'
        )
        UserProfile.objects.create(
            user=admin_user,
            user_type='admin',
            bio='Platform administrator'
        )
        print("✅ Admin user created successfully")
    else:
        print("ℹ️ Admin user already exists")

    # Create regular user
    if not User.objects.filter(username='user').exists():
        regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='User123!',
            first_name='Regular',
            last_name='User'
        )
        UserProfile.objects.create(
            user=regular_user,
            user_type='regular',
            bio='Regular platform user'
        )
        print("✅ Regular user created successfully")
    else:
        print("ℹ️ Regular user already exists")

    # Create author user
    if not User.objects.filter(username='author').exists():
        author_user = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='Author123!',
            first_name='Content',
            last_name='Author'
        )
        UserProfile.objects.create(
            user=author_user,
            user_type='author',
            bio='Content creator for the platform'
        )
        print("✅ Author user created successfully")
    else:
        print("ℹ️ Author user already exists")

def create_categories():
    """Create default categories."""
    categories = ['Technology', 'Travel', 'Food', 'Health', 'Business']
    
    for category_name in categories:
        if not Category.objects.filter(name=category_name).exists():
            Category.objects.create(
                name=category_name,
                slug=slugify(category_name),
                description=f'Articles related to {category_name.lower()}'
            )
            print(f"✅ Category '{category_name}' created")
        else:
            print(f"ℹ️ Category '{category_name}' already exists")

def create_tags():
    """Create default tags."""
    tags = ['Web Development', 'Mobile', 'AI', 'Design', 'Marketing', 'Tips', 'Tutorial', 'Review']
    
    for tag_name in tags:
        if not Tag.objects.filter(tag_name=tag_name).exists():
            Tag.objects.create(
                tag_name=tag_name,
                slug=slugify(tag_name)
            )
            print(f"✅ Tag '{tag_name}' created")
        else:
            print(f"ℹ️ Tag '{tag_name}' already exists")

def create_sample_articles():
    """Create sample articles."""
    # Ensure we have users, categories and tags
    if not User.objects.filter(username='author').exists():
        print("❌ Author user doesn't exist. Please run create_users() first.")
        return
    
    author = User.objects.get(username='author')
    
    # Sample article data
    sample_articles = [
        {
            'title': 'Getting Started with Django REST Framework',
            'content': '## Introduction to Django REST Framework\n\nDjango REST Framework (DRF) is a powerful toolkit for building Web APIs in Django. This article will guide you through setting up your first API project...',
            'category_name': 'Technology',
            'tags': ['Web Development', 'Tutorial']
        },
        {
            'title': 'Top Travel Destinations for 2025',
            'content': '## Exploring New Horizons\n\nAs travel continues to evolve post-pandemic, new destinations are emerging as favorites among travelers. Here are our top picks for 2025...',
            'category_name': 'Travel',
            'tags': ['Tips', 'Review']
        }
    ]
    
    for article_data in sample_articles:
        title = article_data['title']
        if not Article.objects.filter(title=title).exists():
            # Get category
            try:
                category = Category.objects.get(name=article_data['category_name'])
            except Category.DoesNotExist:
                print(f"❌ Category '{article_data['category_name']}' not found")
                continue
            
            # Create article
            article = Article.objects.create(
                title=title,
                slug=slugify(title),
                content=article_data['content'],
                author=author,
                category=category
            )
            
            # Add tags
            for tag_name in article_data['tags']:
                try:
                    tag = Tag.objects.get(tag_name=tag_name)
                    article.tags.add(tag)
                except Tag.DoesNotExist:
                    print(f"❌ Tag '{tag_name}' not found")
            
            print(f"✅ Article '{title}' created")
        else:
            print(f"ℹ️ Article '{title}' already exists")

def create_sample_comments():
    """Create sample comments."""
    # Ensure we have users and articles
    if not User.objects.filter(username='user').exists() or not Article.objects.exists():
        print("❌ Users or articles don't exist. Please run previous functions first.")
        return
    
    user = User.objects.get(username='user')
    admin = User.objects.get(username='admin')
    
    # Get the first article
    try:
        article = Article.objects.first()
        
        # Create a comment
        comment1 = Comment.objects.create(
            article=article,
            user=user,
            content="Great article! Thanks for sharing this information."
        )
        print(f"✅ Comment by {user.username} created")
        
        # Create a reply
        Comment.objects.create(
            article=article,
            user=admin,
            content="Thank you for your feedback!",
            parent=comment1
        )
        print(f"✅ Reply by {admin.username} created")
        
    except Exception as e:
        print(f"❌ Error creating comments: {e}")

def run_all():
    """Run all seeding functions."""
    print("\n=== Starting database seeding ===\n")
    create_users()
    create_categories()
    create_tags()
    create_sample_articles()
    create_sample_comments()
    print("\n=== Database seeding completed ===\n")
    print("You can now login with the following credentials:")
    print("Admin: username='admin', password='Admin123!'")
    print("Regular user: username='user', password='User123!'")
    print("Author: username='author', password='Author123!'")

if __name__ == "__main__":
    run_all()
