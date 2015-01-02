module Jekyll
  class EnvironmentVariablesGenerator < Generator
    def generate(site)
      site.config['cms'] = ENV['CMS_ENV'] || 'production'
      # Add other environment variables to `site.config` here...
    end
 
  end

end