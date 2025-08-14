from rest_framework.routers import DefaultRouter
from .views import ImportBatchViewSet, ImportRowViewSet

router = DefaultRouter()
router.register(r"import_batches", ImportBatchViewSet, basename="importbatch")
router.register(r"import_rows", ImportRowViewSet, basename="importrow")

urlpatterns = router.urls
