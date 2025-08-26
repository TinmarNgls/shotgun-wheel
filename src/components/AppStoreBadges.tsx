interface AppStoreBadgesProps {
  onDownload: () => void;
}

export const AppStoreBadges = ({ onDownload }: AppStoreBadgesProps) => {
  const handleStoreClick = (store: 'ios' | 'android') => {
    const urls = {
      ios: 'https://apps.apple.com/fr/app/shotgun-musique-live/id760028892',
      android: 'https://play.google.com/store/apps/details?id=com.shotguntheapp.android&hl=fr'
    };
    
    window.open(urls[store], '_blank');
    onDownload();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
      {/* App Store Button */}
      <button
        onClick={() => handleStoreClick('ios')}
        className="group relative overflow-hidden bg-black hover:bg-gray-900 text-white rounded-xl px-6 py-3 transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[200px]"
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🍎</div>
          <div className="text-left">
            <div className="text-xs opacity-80">Download on the</div>
            <div className="text-lg font-semibold">App Store</div>
          </div>
        </div>
      </button>

      {/* Google Play Button */}
      <button
        onClick={() => handleStoreClick('android')}
        className="group relative overflow-hidden bg-black hover:bg-gray-900 text-white rounded-xl px-6 py-3 transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[200px]"
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📱</div>
          <div className="text-left">
            <div className="text-xs opacity-80">Get it on</div>
            <div className="text-lg font-semibold">Google Play</div>
          </div>
        </div>
      </button>
    </div>
  );
};