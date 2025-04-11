from django.contrib import admin

from .models import *

class EmailAdmin(admin.ModelAdmin):
  list_display = [field.name for field in Email._meta.fields]


# Register your models here.

admin.site.register(Email, EmailAdmin)
admin.site.register(User)