const StoreFooter = () => (
  <footer className="border-t border-tech-gray-200 bg-tech-white">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-8">
          <span className="text-tech-black tracking-widest">© SCALE MAIL 2026</span>
          <span className="text-tech-gray-800 tracking-widest">ALL RIGHTS RESERVED</span>
        </div>
        <div className="flex items-center space-x-8">
          <button className="text-tech-black hover:text-tech-gray-800 transition-instant tracking-widest">TERMS</button>
          <button className="text-tech-black hover:text-tech-gray-800 transition-instant tracking-widest">PRIVACY</button>
        </div>
      </div>
    </div>
  </footer>
);

export default StoreFooter;
