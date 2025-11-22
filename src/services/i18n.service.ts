import { Injectable, signal, computed } from '@angular/core';

type Locale = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'ja' | 'zh';

interface Translations {
  [key: string]: string;
}

const translations: Record<Locale, Translations> = {
  en: {
    'story.create': 'Create Story',
    'story.publish': 'Publish',
    'story.cancel': 'Cancel',
    'story.uploading': 'Publishing...',
    'story.addMedia': 'Add Photo or Video',
    'story.maxSize': 'Max 100MB • Images & Videos',
    'story.viewCount': '{count} views',
    'story.reply': 'Reply',
    'story.react': 'React',
    'story.previous': 'Previous story',
    'story.next': 'Next story',
    'story.close': 'Close story viewer',
  },
  es: {
    'story.create': 'Crear Historia',
    'story.publish': 'Publicar',
    'story.cancel': 'Cancelar',
    'story.uploading': 'Publicando...',
    'story.addMedia': 'Agregar Foto o Video',
    'story.maxSize': 'Máx 100MB • Imágenes y Videos',
    'story.viewCount': '{count} vistas',
    'story.reply': 'Responder',
    'story.react': 'Reaccionar',
    'story.previous': 'Historia anterior',
    'story.next': 'Siguiente historia',
    'story.close': 'Cerrar visor de historias',
  },
  fr: {
    'story.create': 'Créer une Story',
    'story.publish': 'Publier',
    'story.cancel': 'Annuler',
    'story.uploading': 'Publication...',
    'story.addMedia': 'Ajouter Photo ou Vidéo',
    'story.maxSize': 'Max 100Mo • Images et Vidéos',
    'story.viewCount': '{count} vues',
    'story.reply': 'Répondre',
    'story.react': 'Réagir',
    'story.previous': 'Story précédente',
    'story.next': 'Story suivante',
    'story.close': 'Fermer le lecteur de story',
  },
  de: {
    'story.create': 'Story Erstellen',
    'story.publish': 'Veröffentlichen',
    'story.cancel': 'Abbrechen',
    'story.uploading': 'Wird veröffentlicht...',
    'story.addMedia': 'Foto oder Video Hinzufügen',
    'story.maxSize': 'Max 100MB • Bilder & Videos',
    'story.viewCount': '{count} Aufrufe',
    'story.reply': 'Antworten',
    'story.react': 'Reagieren',
    'story.previous': 'Vorherige Story',
    'story.next': 'Nächste Story',
    'story.close': 'Story-Viewer schließen',
  },
  ar: {
    'story.create': 'إنشاء قصة',
    'story.publish': 'نشر',
    'story.cancel': 'إلغاء',
    'story.uploading': 'جاري النشر...',
    'story.addMedia': 'إضافة صورة أو فيديو',
    'story.maxSize': 'الحد الأقصى 100 ميجابايت • صور وفيديوهات',
    'story.viewCount': '{count} مشاهدة',
    'story.reply': 'رد',
    'story.react': 'تفاعل',
    'story.previous': 'القصة السابقة',
    'story.next': 'القصة التالية',
    'story.close': 'إغلاق عارض القصص',
  },
  ja: {
    'story.create': 'ストーリーを作成',
    'story.publish': '公開',
    'story.cancel': 'キャンセル',
    'story.uploading': '公開中...',
    'story.addMedia': '写真または動画を追加',
    'story.maxSize': '最大100MB • 画像と動画',
    'story.viewCount': '{count} 回の閲覧',
    'story.reply': '返信',
    'story.react': 'リアクション',
    'story.previous': '前のストーリー',
    'story.next': '次のストーリー',
    'story.close': 'ストーリービューアを閉じる',
  },
  zh: {
    'story.create': '创建故事',
    'story.publish': '发布',
    'story.cancel': '取消',
    'story.uploading': '发布中...',
    'story.addMedia': '添加照片或视频',
    'story.maxSize': '最大100MB • 图片和视频',
    'story.viewCount': '{count} 次查看',
    'story.reply': '回复',
    'story.react': '反应',
    'story.previous': '上一个故事',
    'story.next': '下一个故事',
    'story.close': '关闭故事查看器',
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private locale = signal<Locale>('en');
  
  isRTL = computed(() => this.locale() === 'ar');
  currentLocale = this.locale.asReadonly();

  setLocale(locale: Locale) {
    this.locale.set(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
  }

  t(key: string, params?: Record<string, any>): string {
    let text = translations[this.locale()][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.locale()).format(date);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat(this.locale()).format(num);
  }
}
