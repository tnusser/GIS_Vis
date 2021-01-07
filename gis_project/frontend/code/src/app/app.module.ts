// angular components
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// angular material
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog'

// own components
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { SettingsComponent, DialogElementsExampleDialog, DialogForSettings} from './settings/settings.component';

@NgModule({
  declarations: [AppComponent, MapComponent, SettingsComponent, DialogForSettings, DialogElementsExampleDialog],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    HttpClientModule, 
    MatDialogModule
  ],
  entryComponents: [
    DialogElementsExampleDialog,
    DialogForSettings
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
