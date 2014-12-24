module Jekyll
  module StripTagFilter
    def strip_tag(input, tag)
      empty = ''.freeze
      input.to_s.gsub(/<.#{tag}*?>/m, empty)
    end
     
    def strip_p(input)
      strip_tag(input, 'p')
    end
  end
end

Liquid::Template.register_filter(Jekyll::StripTagFilter)