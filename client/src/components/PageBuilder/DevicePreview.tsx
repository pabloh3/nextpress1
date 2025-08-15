interface DevicePreviewProps {
  device: 'desktop' | 'tablet' | 'mobile';
  children: React.ReactNode;
}

export default function DevicePreview({ device, children }: DevicePreviewProps) {
  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          maxWidth: '375px',
          minHeight: '667px',
        };
      case 'tablet':
        return {
          width: '768px',
          minHeight: '1024px',
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          minHeight: '800px',
        };
    }
  };

  return (
    <div className="flex justify-center">
      <div 
        style={getDeviceStyles()}
        className="transition-all duration-300 ease-in-out"
      >
        {children}
      </div>
    </div>
  );
}