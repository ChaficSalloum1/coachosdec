const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '# CoachOS Xcode fmt consteval workaround';

const PODFILE_PATCH = `
    ${PATCH_MARKER}
    # fmt 11.x can trip Apple Clang/Xcode consteval checks during iOS builds.
    # Disable fmt consteval support for pod targets that include fmt headers, and keep
    # fmt/RCT-Folly on C++17 so the consteval path is not selected.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        definitions = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS']
        definitions = ['$(inherited)'] if definitions.nil?
        definitions = definitions.split(' ') if definitions.is_a?(String)
        definitions << 'FMT_USE_CONSTEVAL=0' unless definitions.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = definitions

        cplusplus_flags = config.build_settings['OTHER_CPLUSPLUSFLAGS']
        cplusplus_flags = ['$(inherited)'] if cplusplus_flags.nil?
        cplusplus_flags = cplusplus_flags.split(' ') if cplusplus_flags.is_a?(String)
        cplusplus_flags << '-DFMT_USE_CONSTEVAL=0' unless cplusplus_flags.include?('-DFMT_USE_CONSTEVAL=0')
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = cplusplus_flags

        if target.name == 'fmt' || target.name == 'RCT-Folly'
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let content = fs.readFileSync(podfilePath, 'utf8');

      if (content.includes(PATCH_MARKER)) {
        return config;
      }

      const marker = '    # This is necessary for Xcode 14';
      if (content.includes(marker)) {
        content = content.replace(marker, `${PODFILE_PATCH}\n${marker}`);
      } else {
        content = content.replace(
          /(post_install do \|installer\|[\s\S]*?react_native_post_install\([\s\S]*?\n    \))/,
          `$1\n${PODFILE_PATCH}`,
        );
      }

      fs.writeFileSync(podfilePath, content, 'utf8');
      return config;
    },
  ]);
};
