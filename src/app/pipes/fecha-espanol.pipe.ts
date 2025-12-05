import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaEspanol'
})
export class FechaEspanolPipe implements PipeTransform {
  
  private meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  transform(value: string | Date): string {
    if (!value) return '';
    
    const fecha = new Date(value);
    
    // Obtener componentes de la fecha
    const dia = fecha.getDate();
    const mes = this.meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    
    // Obtener hora en formato 12 horas
    let horas = fecha.getHours();
    const minutos = fecha.getMinutes();
    const ampm = horas >= 12 ? 'PM' : 'AM';
    
    horas = horas % 12;
    horas = horas ? horas : 12; // Si es 0, mostrar 12
    
    const minutosStr = minutos < 10 ? '0' + minutos : minutos;
    
    return `${dia} de ${mes} de ${anio}, ${horas}:${minutosStr} ${ampm}`;
  }
}
