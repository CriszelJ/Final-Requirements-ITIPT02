import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonMenu, IonMenuButton, IonButtons, IonIcon, IonFab, IonFabButton, IonButton, IonInput, IonTextarea, ActionSheetController, ToastController} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { clipboardOutline, archiveOutline, trashOutline, addOutline, bulbOutline,menuOutline, searchOutline, ellipsisVertical, imageOutline, checkboxOutline, colorPaletteOutline, arrowBackOutline, pinOutline, pin, refreshOutline, closeCircleOutline, moonOutline, sunnyOutline, copyOutline } from 'ionicons/icons';

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  image?: string;
  isPinned: boolean;
  isTrashed: boolean;
  isArchived: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonMenu, IonMenuButton, IonButtons, IonIcon, IonFab, IonFabButton, IonButton, IonInput, IonTextarea],

})
export class HomePage implements OnInit {
  currentView: string = 'notes'; 
  notes: Note[] = [];
 
  isInputExpanded: boolean = false;
  editingNoteId: number | null = null;
  
  
  currentTitle: string = '';
  currentContent: string = '';
  currentColor: string = 'transparent';
  currentImage: string = '';
  currentIsPinned: boolean = false;

  
  tempNoteForImage: Note | null = null;

  searchQuery: string = '';
  isDarkMode: boolean = true; 

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private actionSheetCtrl: ActionSheetController,
  ) {
    addIcons({bulbOutline, archiveOutline, trashOutline, checkboxOutline, imageOutline, refreshOutline, closeCircleOutline, addOutline, arrowBackOutline, pinOutline, pin,colorPaletteOutline, clipboardOutline, menuOutline, searchOutline, ellipsisVertical, moonOutline, sunnyOutline, copyOutline});
  }

  get displayedNotes() {
  if (this.currentView === 'notes') return this.activeNotes;
  if (this.currentView === 'archive') return this.archivedNotes;
  if (this.currentView === 'trash') return this.trashedNotes;
  return [];
}

getEmptyStateMessage() {
  const messages: any = {
    'notes': 'Notes you add appear here',
    'archive': 'Archive appear here',
    'trash': 'No Note in Trash'
  };
  return messages[this.currentView] || '';
}

  ngOnInit() {
    this.loadNotes();
    this.renderer.addClass(this.document.body, 'dark');
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.renderer.addClass(this.document.body, 'dark');
    } else {
      this.renderer.removeClass(this.document.body, 'dark');
    }
  }

  loadNotes() {
    const savedNotes = localStorage.getItem('keep-notes');
    this.notes = savedNotes ? JSON.parse(savedNotes) : [];
  }

  saveNotesToStorage() {
    localStorage.setItem('keep-notes', JSON.stringify(this.notes));
  }


  openEditor(note?: Note) {
    this.isInputExpanded = true;
    
    if (note) {
      this.editingNoteId = note.id;
      this.currentTitle = note.title;
      this.currentContent = note.content;
      this.currentColor = note.color;
      this.currentImage = note.image || '';
      this.currentIsPinned = note.isPinned;
    } else {
      this.editingNoteId = null;
      this.resetForm();
    }
  }
  
  cancelEdit() {
    this.isInputExpanded = false;
    this.resetForm();
  }

  resetForm() {
    this.currentTitle = '';
    this.currentContent = '';
    this.currentColor = 'transparent';
    this.currentImage = '';
    this.currentIsPinned = false;
    this.editingNoteId = null;
  }

  saveNote() {
    if (!this.currentTitle.trim() && !this.currentContent.trim() && !this.currentImage) {
      this.cancelEdit();
      return;
    }

    if (this.editingNoteId) {
      const index = this.notes.findIndex(n => n.id === this.editingNoteId);
      if (index > -1) {
        this.notes[index] = {
          ...this.notes[index],
          title: this.currentTitle,
          content: this.currentContent,
          color: this.currentColor,
          image: this.currentImage,
          isPinned: this.currentIsPinned,
          id: Date.now()
        };
      }
    } else {
      const note: Note = {
        id: Date.now(),
        title: this.currentTitle,
        content: this.currentContent,
        color: this.currentColor,
        image: this.currentImage,
        isPinned: this.currentIsPinned,
        isTrashed: true,
        isArchived: false
      };
      this.notes.unshift(note);
    }

    this.saveNotesToStorage();
    this.cancelEdit();
  }
  triggerImageUpload(fileInput: HTMLInputElement, event?: Event, note?: Note) {
    if (event) event.stopPropagation();
    
    if (note) {
      this.tempNoteForImage = note;
    } else {
      this.tempNoteForImage = null;
    }

    fileInput.click();
  }

 
  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result as string;

        if (this.tempNoteForImage) {
          this.tempNoteForImage.image = base64Image;
          this.saveNotesToStorage();
        } else {
          this.currentImage = base64Image;
        }
        input.value = ''; 
      };
      
      reader.readAsDataURL(file);
    }
  }

  async presentColorPalette(ev: Event, note?: Note) {
    ev.stopPropagation();
    const colors = [
      { name: 'Default', code: 'transparent' },
      { name: 'Red', code: '#bd322dff' },
      { name: 'Green', code: '#59a92eff' },
      { name: 'Blue', code: '#2b61a8ff' },
      { name: 'Yellow', code: '#b2a72bff' },
      { name: 'Purple', code: '#6c33aaff' },
    ];

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Pick a color',
      buttons: [
        ...colors.map(c => ({
          text: c.name,
          icon: 'color-palette-outline',
          handler: () => {
            if (note) {
              note.color = c.code;
              this.saveNotesToStorage();
            } else {
              this.currentColor = c.code;
            }
          }
        })),
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  togglePin(ev: Event | null, note?: Note) {
    if (ev) ev.stopPropagation();
    if (note) {
      note.isPinned = !note.isPinned;
      this.saveNotesToStorage();
    } else {
      this.currentIsPinned = !this.currentIsPinned;
    }
  }

  trashNote(ev: Event, id: number) {
    ev.stopPropagation();
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.isTrashed = true;
      note.isArchived = false; 
      note.isPinned = false;
      this.saveNotesToStorage();
    }
  }

  archiveNote(ev: Event, id: number) {
    ev.stopPropagation();
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.isArchived = true;
      note.isTrashed = false;
      note.isPinned = false;
      this.saveNotesToStorage();
    }
  }

  restoreNote(ev: Event, id: number) {
    ev.stopPropagation();
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.isTrashed = false;
      note.isArchived = false;
      this.saveNotesToStorage();
    }
  }

  deleteForever(ev: Event, id: number) {
    ev.stopPropagation();
    this.notes = this.notes.filter(n => n.id !== id);
    this.saveNotesToStorage();
  }

  get activeNotes() {
    const list = this.filterList(this.notes.filter(n => !n.isTrashed && !n.isArchived));
    return list.sort((a, b) => (a.isPinned === b.isPinned) ? 0 : a.isPinned ? -1 : 1);
  }

  get archivedNotes() {
    return this.filterList(this.notes.filter(n => n.isArchived && !n.isTrashed));
  }

  get trashedNotes() {
    return this.filterList(this.notes.filter(n => n.isTrashed));
  }

  filterList(list: Note[]) {
    if (!this.searchQuery.trim()) return list;
    const lowerQuery = this.searchQuery.toLowerCase();
    return list.filter(n => 
      n.title.toLowerCase().includes(lowerQuery) || 
      n.content.toLowerCase().includes(lowerQuery)
    );
  }

  switchView(view: string) {
    this.currentView = view;
  }

  getViewTitle() {
    if (this.currentView === 'notes') return 'Keep Notes';

    if (this.currentView === 'archive') return 'Archive';
    if (this.currentView === 'trash') return 'Trash';
    return 'Keep';
  }
}