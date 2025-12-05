import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './components/main/main.component';
import { CompraRifasComponent } from './components/compra-rifas/compra-rifas.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { FechaEspanolPipe } from './pipes/fecha-espanol.pipe';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    CompraRifasComponent,
    AdminPanelComponent,
    FechaEspanolPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
