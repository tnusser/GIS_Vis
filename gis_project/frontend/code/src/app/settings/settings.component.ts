import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogModule} from '@angular/material/dialog';

declare global {
  var rate4Back: string; 
}

declare global {
  var norm4Back: string; 
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  constructor(public dialog: MatDialog) {}

  @Output()
  settUpdate: EventEmitter<boolean> = new EventEmitter<boolean>();
  
  updateSettings(): void {
    //console.log((<HTMLInputElement>document.getElementById("myRange")).value);
    this.settUpdate.emit(true);
  }

  openDialog() {
    this.dialog.open(DialogElementsExampleDialog);
  }

  openSettingsDialog() {
    const dialogSettings = this.dialog.open(DialogForSettings);

    dialogSettings.afterClosed().subscribe(result => {
      if (result){   
        this.updateSettings();
      } 
      else {
        console.log(`Dialog result: ${result}`);
      }
    });
  }
  
}

@Component({
  selector: 'dialog-elements-example-dialog',
  templateUrl: './dialog-content-example-dialog.html',
})
export class DialogElementsExampleDialog {}

@Component({
  selector: 'dialog-elements-example-dialog',
  templateUrl: './dialog-content-settings.html',
})
export class DialogForSettings {
  normWhich(data:string) {
    //console.log('erfolg' + data);
    globalThis.norm4Back= data;
  }

  rateWhich(data:string) {
    //console.log('erfolg' + data);
    globalThis.rate4Back = data;
    //window.rate4Back= data;
  }

}