async function get_cpu_braille_character(cpu_usage_percent) {
    if (cpu_usage_percent < 10) {
        return '⣀';
    }
    return '⣿';
}

module.exports = get_cpu_braille_character;
