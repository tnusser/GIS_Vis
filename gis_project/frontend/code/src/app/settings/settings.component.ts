import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogModule} from '@angular/material/dialog';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  // this output can be listened to in the parent component
  @Output()
  markerAdded: EventEmitter<{
    latitude: number;
    longitude: number;
  }> = new EventEmitter<{ latitude: number; longitude: number }>();

  // this output can be listened to in the parent component
  @Output()
  pubsAdded: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * When the add marker button was clicked, emit the location where the marker should be added
   * @param marker Latitude and longitude of the marker
   */
  onSubmit(marker: { latitude: number; longitude: number }): void {
    this.markerAdded.emit(marker);
  }

    /**
   * When the add marker button was clicked, emit the location where the marker should be added
   * @param marker Latitude and longitude of the marker
   */
  addPubs(): void {
    this.pubsAdded.emit(true);
  }

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
export class DialogForSettings {}



/*
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class DialogElementsExample {
  constructor(public dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(DialogElementsExampleDialog);
  }
}*/
