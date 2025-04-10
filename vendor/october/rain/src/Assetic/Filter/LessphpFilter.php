<?php namespace October\Rain\Assetic\Filter;


use October\Rain\Assetic\Asset\AssetInterface;
use October\Rain\Assetic\Factory\AssetFactory;
use October\Rain\Assetic\Util\LessUtils;

/**
 * Loads LESS files using the PHP implementation of less, lessphp.
 *
 * Less files are mostly compatible, but there are slight differences.
 *
 * @link http://leafo.net/lessphp/
 *
 * @author David Buchmann <david@liip.ch>
 * @author Kris Wallsmith <kris.wallsmith@gmail.com>
 */
class LessphpFilter implements DependencyExtractorInterface
{
    private $presets = [];
    private $formatter;
    private $preserveComments;
    private $customFunctions = [];
    private $options = [];

    /**
     * Lessphp Load Paths
     *
     * @var array
     */
    protected $loadPaths = [];

    /**
     * Adds a load path to the paths used by lessphp
     *
     * @param string $path Load Path
     */
    public function addLoadPath($path)
    {
        $this->loadPaths[] = $path;
    }

    /**
     * Sets load paths used by lessphp
     *
     * @param array $loadPaths Load paths
     */
    public function setLoadPaths(array $loadPaths)
    {
        $this->loadPaths = $loadPaths;
    }

    public function setPresets(array $presets)
    {
        $this->presets = $presets;
    }

    public function setOptions(array $options)
    {
        $this->options = $options;
    }

    /**
     * @param string $formatter One of "lessjs", "compressed", or "classic".
     */
    public function setFormatter($formatter)
    {
        $this->formatter = $formatter;
    }

    /**
     * @param boolean $preserveComments
     */
    public function setPreserveComments($preserveComments)
    {
        $this->preserveComments = $preserveComments;
    }

    public function filterLoad(AssetInterface $asset)
    {
        $lc = new \lessc();
        if ($dir = $asset->getSourceDirectory()) {
            $lc->importDir = $dir;
        }

        foreach ($this->loadPaths as $loadPath) {
            $lc->addImportDir($loadPath);
        }

        foreach ($this->customFunctions as $name => $callable) {
            $lc->registerFunction($name, $callable);
        }

        if ($this->formatter) {
            $lc->setFormatter($this->formatter);
        }

        if (null !== $this->preserveComments) {
            $lc->setPreserveComments($this->preserveComments);
        }

        if (method_exists($lc, 'setOptions') && count($this->options) > 0) {
            $lc->setOptions($this->options);
        }

        $asset->setContent($lc->parse($asset->getContent(), $this->presets));
    }

    public function registerFunction($name, $callable)
    {
        $this->customFunctions[$name] = $callable;
    }

    public function filterDump(AssetInterface $asset)
    {
    }

    public function getChildren(AssetFactory $factory, $content, $loadPath = null)
    {
        $loadPaths = $this->loadPaths;
        if ($loadPath !== null) {
            $loadPaths[] = $loadPath;
        }

        if (empty($loadPaths)) {
            return [];
        }

        $children = [];
        foreach (LessUtils::extractImports($content) as $reference) {
            if (substr($reference, -4) === '.css') {
                // skip normal css imports
                // todo: skip imports with media queries
                continue;
            }

            if (substr($reference, -5) !== '.less') {
                $reference .= '.less';
            }

            foreach ($loadPaths as $loadPath) {
                if (file_exists($file = $loadPath.'/'.$reference)) {
                    $coll = $factory->createAsset($file, [], ['root' => $loadPath]);
                    foreach ($coll as $leaf) {
                        $leaf->ensureFilter($this);
                        $children[] = $leaf;
                        break 2;
                    }
                }
            }
        }

        return $children;
    }
}
