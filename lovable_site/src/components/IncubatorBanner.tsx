const IncubatorBanner = () => {
  return (
    <section className="w-full bg-gradient-hero py-4 md:py-6">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-white text-base md:text-lg">
          We incubate impact-driven digital health tools. Our current project,{" "}
          <a 
            href="https://www.freebrain.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline font-semibold hover:opacity-80 transition-opacity"
          >
            FreeBrain
          </a>
          , supports individuals with neurological movement disorders.
        </p>
      </div>
    </section>
  );
};

export default IncubatorBanner;
