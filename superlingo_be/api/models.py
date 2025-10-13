from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass

class Lesson(models.Model):
    title = models.CharField(max_length=100)
    level = models.CharField(max_length=10)
    # This change is correct.
    topics = models.JSONField() 

    def __str__(self):
        return f"{self.level} - {self.title}"