import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ModalConfirmClearStorageComponent } from './modal-confirm-clear-storage.component';

describe('ModalConfirmClearStorageComponent', () => {
  let component: ModalConfirmClearStorageComponent;
  let fixture: ComponentFixture<ModalConfirmClearStorageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        TranslateModule.forRoot(),
        ModalConfirmClearStorageComponent,
      ],
      providers: [{ provide: MatDialogRef, useValue: {} }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalConfirmClearStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
