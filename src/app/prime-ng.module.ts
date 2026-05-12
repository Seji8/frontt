// src/app/prime-ng.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { SidebarModule } from 'primeng/sidebar';
import { MenuModule } from 'primeng/menu';
import { DividerModule } from 'primeng/divider';
import { ListboxModule } from 'primeng/listbox';

// Services
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

@NgModule({
  exports: [
    ButtonModule,
    CardModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    InputTextareaModule,
    TagModule,
    BadgeModule,
    ProgressSpinnerModule,
    ToolbarModule,
    TableModule,
    DialogModule,
    ToastModule,
    MessageModule,
    MessagesModule,
    ConfirmDialogModule,
    FileUploadModule,
    SidebarModule,
    MenuModule,
    DividerModule,
    ListboxModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class PrimeNgModule { }