import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TaskManagerScreen from '../app/index';

// La pantalla usa expo-router y SafeAreaView; se reemplazan por versiones simples
// para poder probar la lógica de la pantalla sin navegación ni módulos nativos.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// El servicio real tarda 700 ms por llamada, así que se da más margen que el
// 1000 ms por defecto de findBy/waitFor.
const WAIT = { timeout: 10000 };
jest.setTimeout(30000);

describe('TaskManagerScreen · pruebas de regresión', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // "Simular error API" escribe un console.error a propósito; se silencia para no ensuciar la salida.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Incidencia 2: la lista no se filtraba mientras se escribía en el buscador.
  it('filtra la lista mientras se escribe en el buscador (incidencia 2)', async () => {
    const { findByText, getByTestId, getByText, queryByText } = render(<TaskManagerScreen />);
    await findByText('Corregir navegación', {}, WAIT);

    fireEvent.changeText(getByTestId('search-input'), 'login');

    expect(getByText('Validar login')).toBeTruthy();
    expect(queryByText('Corregir navegación')).toBeNull();
    expect(queryByText('Probar API lenta')).toBeNull();
  });

  // Incidencia 3: al marcar una tarea, la tarjeta no se actualizaba hasta cambiar de pestaña.
  it('actualiza la tarjeta al instante al marcar una tarea como completada (incidencia 3)', async () => {
    const { findByText, getByTestId, getAllByText } = render(<TaskManagerScreen />);
    await findByText('Validar login', {}, WAIT);

    expect(getAllByText('Completada')).toHaveLength(2);
    expect(getAllByText('Pendiente')).toHaveLength(3);

    fireEvent.press(getByTestId('toggle-t01'));

    expect(getAllByText('Completada')).toHaveLength(3);
    expect(getAllByText('Pendiente')).toHaveLength(2);
  });

  // Incidencia 4: tras un error del servicio, el indicador de carga no desaparecía.
  it('apaga el indicador de carga cuando el servicio falla (incidencia 4)', async () => {
    const { findByText, getByTestId, queryByText } = render(<TaskManagerScreen />);
    await findByText('Validar login', {}, WAIT);

    fireEvent.press(getByTestId('simulate-error-button'));

    expect(await findByText('No pudimos cargar las tareas. Probá otra vez.', {}, WAIT)).toBeTruthy();
    await waitFor(() => expect(queryByText('Consultando tareas…')).toBeNull(), WAIT);
  });

  // Incidencia 6: al cambiar de filtro, quedaba expandida una tarjeta que el usuario no abrió.
  it('no deja expandida una tarjeta que el usuario no abrió al cambiar de filtro (incidencia 6)', async () => {
    const { findByText, getByTestId, getByText, queryByTestId } = render(<TaskManagerScreen />);
    await findByText('Validar login', {}, WAIT);

    fireEvent.press(getByTestId('expand-t01'));
    expect(getByTestId('details-t01')).toBeTruthy();

    fireEvent.press(getByText('Completadas'));

    expect(queryByTestId('details-t02')).toBeNull();
    expect(queryByTestId('details-t05')).toBeNull();
  });
});