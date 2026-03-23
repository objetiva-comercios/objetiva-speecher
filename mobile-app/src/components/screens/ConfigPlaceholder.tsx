export function ConfigPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-center" style={{
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))',
      paddingTop: 'var(--sat, 0px)',
    }}>
      <div>
        <h1 className="text-xl font-bold text-gray-800">Configuracion</h1>
        <p className="text-gray-400 mt-2">Proximamente</p>
      </div>
    </div>
  );
}
