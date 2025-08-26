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
        className="transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <img 
          src="/lovable-uploads/d5ed4c9b-f8d0-47ed-85eb-484e64ce7e1a.png" 
          alt="Download on the App Store"
          className="h-14 w-auto rounded-lg"
        />
      </button>

      {/* Google Play Button */}
      <button
        onClick={() => handleStoreClick('android')}
        className="transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <img 
          src="/lovable-uploads/534afd72-b1cf-4b87-9a51-73f5edd90b1e.png" 
          alt="Get it on Google Play"
          className="h-14 w-auto rounded-lg"
        />
      </button>
    </div>
  );
};